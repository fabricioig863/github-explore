import { http, HttpResponse } from 'msw';

import { AuthDeniedError } from '@/domain/errors/AuthError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';
import * as secureTokenStorage from 'src/infra/auth/secureTokenStorage';
import { GitHubAuthRepository } from 'src/infra/repositories/GitHubAuthRepository';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

const PROXY_URL = 'https://proxy.test/exchange';

function userDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 583231,
    login: 'octocat',
    name: 'The Octocat',
    email: 'octocat@github.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
    bio: 'mascote',
    ...overrides,
  };
}

describe('GitHubAuthRepository (integração HTTP via msw)', () => {
  const ORIGINAL_PROXY = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_OAUTH_PROXY_URL = PROXY_URL;
  });

  afterEach(async () => {
    await secureTokenStorage.clear();
    if (ORIGINAL_PROXY === undefined) delete process.env.EXPO_PUBLIC_OAUTH_PROXY_URL;
    else process.env.EXPO_PUBLIC_OAUTH_PROXY_URL = ORIGINAL_PROXY;
  });

  describe('signIn', () => {
    it('troca o code no proxy, busca /user autenticado e persiste a sessão', async () => {
      let exchangeBody: unknown;
      let userAuthHeader: string | null = null;
      server.use(
        http.post(PROXY_URL, async ({ request }) => {
          exchangeBody = await request.json();
          return HttpResponse.json({ access_token: 'gho_abc', token_type: 'bearer' });
        }),
        http.get(`${GITHUB_BASE_URL}/user`, ({ request }) => {
          userAuthHeader = request.headers.get('authorization');
          return HttpResponse.json(userDto());
        }),
      );

      const session = await new GitHubAuthRepository().signIn('code-123');

      expect(exchangeBody).toEqual({ code: 'code-123' });
      expect(userAuthHeader).toBe('Bearer gho_abc');
      expect(session.token).toBe('gho_abc');
      expect(session.user.login).toBe('octocat');
      expect(session.user.avatarUrl).toBe(
        'https://avatars.githubusercontent.com/u/583231?v=4',
      );
      // snake_case não vaza
      expect(session.user).not.toHaveProperty('avatar_url');
    });

    it('lança AuthDeniedError quando o proxy devolve error', async () => {
      server.use(
        http.post(PROXY_URL, () =>
          HttpResponse.json({ error: 'bad_verification_code', error_description: 'expirado' }),
        ),
      );

      await expect(new GitHubAuthRepository().signIn('x')).rejects.toBeInstanceOf(AuthDeniedError);
    });

    it('lança AuthDeniedError quando não vem access_token', async () => {
      server.use(http.post(PROXY_URL, () => HttpResponse.json({})));

      await expect(new GitHubAuthRepository().signIn('x')).rejects.toBeInstanceOf(AuthDeniedError);
    });
  });

  describe('getCurrentSession', () => {
    it('devolve null quando não há sessão persistida', async () => {
      await secureTokenStorage.clear();

      expect(await new GitHubAuthRepository().getCurrentSession()).toBeNull();
    });

    it('valida o token via /user e devolve a sessão re-hidratada', async () => {
      await secureTokenStorage.setSession({
        token: 'gho_stored',
        user: {
          id: 1,
          login: 'old',
          name: null,
          email: null,
          avatarUrl: 'a',
          bio: null,
          publicReposCount: 0,
          followers: 0,
          following: 0,
        },
      });
      server.use(
        http.get(`${GITHUB_BASE_URL}/user`, () => HttpResponse.json(userDto({ login: 'fresh' }))),
      );

      const session = await new GitHubAuthRepository().getCurrentSession();

      expect(session?.token).toBe('gho_stored');
      expect(session?.user.login).toBe('fresh');
    });

    it('em 401 limpa o storage e devolve null (sessão expirada)', async () => {
      await secureTokenStorage.setSession({
        token: 'gho_expired',
        user: {
          id: 1,
          login: 'x',
          name: null,
          email: null,
          avatarUrl: 'a',
          bio: null,
          publicReposCount: 0,
          followers: 0,
          following: 0,
        },
      });
      server.use(
        http.get(`${GITHUB_BASE_URL}/user`, () =>
          HttpResponse.json({ message: 'Bad credentials' }, { status: 401 }),
        ),
      );

      const result = await new GitHubAuthRepository().getCurrentSession();

      expect(result).toBeNull();
      expect(secureTokenStorage.getCachedToken()).toBeNull();
    });

    it('em erro inesperado (500) lança UnexpectedError', async () => {
      await secureTokenStorage.setSession({
        token: 'gho_x',
        user: {
          id: 1,
          login: 'x',
          name: null,
          email: null,
          avatarUrl: 'a',
          bio: null,
          publicReposCount: 0,
          followers: 0,
          following: 0,
        },
      });
      server.use(
        http.get(`${GITHUB_BASE_URL}/user`, () =>
          HttpResponse.json({ message: 'boom' }, { status: 500 }),
        ),
      );

      await expect(new GitHubAuthRepository().getCurrentSession()).rejects.toBeInstanceOf(
        UnexpectedError,
      );
    });
  });

  describe('signOut', () => {
    it('limpa o storage', async () => {
      await secureTokenStorage.setToken('gho_x');

      await new GitHubAuthRepository().signOut();

      expect(secureTokenStorage.getCachedToken()).toBeNull();
    });
  });
});

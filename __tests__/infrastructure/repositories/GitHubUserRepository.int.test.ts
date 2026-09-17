import { http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { GitHubUserRepository } from 'src/infra/repositories/GitHubUserRepository';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

function makeRepoDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'react',
    full_name: 'facebook/react',
    owner: {
      id: 69631,
      login: 'facebook',
      avatar_url: 'https://x/a.png',
      type: 'Organization' as const,
    },
    description: 'A library',
    stargazers_count: 1000,
    forks_count: 50,
    watchers_count: 1000,
    open_issues_count: 5,
    language: 'JavaScript',
    html_url: 'https://github.com/facebook/react',
    pushed_at: '2026-04-15T10:00:00Z',
    topics: [],
    license: { name: 'MIT', spdx_id: 'MIT' },
    ...overrides,
  };
}

describe('GitHubUserRepository (integração HTTP via msw)', () => {
  describe('listUserRepos', () => {
    it('GET /users/:login/repos com sort=updated/page/per_page e mapeia DTO->domínio', async () => {
      let capturedUrl: URL | undefined;
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json([makeRepoDto({ id: 1, name: 'react' })]);
        }),
      );

      const result = await new GitHubUserRepository().listUserRepos({
        login: 'facebook',
        page: 1,
        perPage: 30,
      });

      expect(capturedUrl?.pathname).toBe('/users/facebook/repos');
      expect(capturedUrl?.searchParams.get('sort')).toBe('updated');
      expect(capturedUrl?.searchParams.get('page')).toBe('1');
      expect(capturedUrl?.searchParams.get('per_page')).toBe('30');
      expect(result.items[0]?.name).toBe('react');
      expect(result.items[0]?.pushedAt).toBeInstanceOf(Date);
      expect(result.items[0]).not.toHaveProperty('stargazers_count');
    });

    it.each([
      ['página cheia (=perPage) → hasNextPage true', 2, true],
      ['página parcial (<perPage) → hasNextPage false', 1, false],
    ])('infere hasNextPage pelo tamanho: %s', async (_label, count, expected) => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () =>
          HttpResponse.json(Array.from({ length: count }, (_, i) => makeRepoDto({ id: i }))),
        ),
      );

      const result = await new GitHubUserRepository().listUserRepos({
        login: 'facebook',
        page: 1,
        perPage: 2,
      });

      expect(result.hasNextPage).toBe(expected);
    });

    it('em 404 levanta NotFoundError com contexto "Repositórios de login"', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () =>
          HttpResponse.json({ message: 'not found' }, { status: 404 }),
        ),
      );

      const promise = new GitHubUserRepository().listUserRepos({
        login: 'ghost',
        page: 1,
        perPage: 30,
      });
      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await promise.catch((err: NotFoundError) => {
        expect(err.message).toContain('Repositórios de ghost');
      });
    });

    it('em erro de rede levanta NetworkError', async () => {
      server.use(http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () => HttpResponse.error()));

      await expect(
        new GitHubUserRepository().listUserRepos({ login: 'facebook', page: 1, perPage: 30 }),
      ).rejects.toBeInstanceOf(NetworkError);
    });
  });
});

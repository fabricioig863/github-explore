import { delay, http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import * as accessTokenStorage from 'src/infra/auth/accessTokenStorage';
import { mapHttpError } from 'src/infra/http/errorMapper';
import { createHttpClient } from 'src/infra/http/httpClient';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

describe('httpClient (integração HTTP via msw)', () => {
  describe('headers padrão', () => {
    it('envia X-GitHub-Api-Version: 2022-11-28 em toda request', async () => {
      let capturedVersion: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/ping`, ({ request }) => {
          capturedVersion = request.headers.get('x-github-api-version');
          return HttpResponse.json({ ok: true });
        }),
      );

      await createHttpClient().get('/ping');

      expect(capturedVersion).toBe('2022-11-28');
    });

    it('envia Accept: application/vnd.github+json', async () => {
      let capturedAccept: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/ping`, ({ request }) => {
          capturedAccept = request.headers.get('accept');
          return HttpResponse.json({ ok: true });
        }),
      );

      await createHttpClient().get('/ping');

      expect(capturedAccept).toContain('application/vnd.github+json');
    });
  });

  describe('autenticação via access token opcional (accessTokenStorage)', () => {
    afterEach(async () => {
      await accessTokenStorage.clearToken();
    });

    it('NÃO envia Authorization quando não há token de sessão', async () => {
      await accessTokenStorage.clearToken();

      let capturedAuth: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/ping`, ({ request }) => {
          capturedAuth = request.headers.get('authorization');
          return HttpResponse.json({ ok: true });
        }),
      );

      await createHttpClient().get('/ping');

      expect(capturedAuth).toBeNull();
    });

    it('envia Bearer <token> quando há token na sessão corrente', async () => {
      await accessTokenStorage.setToken('gho_session_token_123');

      let capturedAuth: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/ping`, ({ request }) => {
          capturedAuth = request.headers.get('authorization');
          return HttpResponse.json({ ok: true });
        }),
      );

      await createHttpClient().get('/ping');

      expect(capturedAuth).toBe('Bearer gho_session_token_123');
    });

    it('lê o token corrente a cada request (atualiza após setToken/clear)', async () => {
      const captured: (string | null)[] = [];
      server.use(
        http.get(`${GITHUB_BASE_URL}/ping`, ({ request }) => {
          captured.push(request.headers.get('authorization'));
          return HttpResponse.json({ ok: true });
        }),
      );
      const client = createHttpClient();

      await accessTokenStorage.setToken('first');
      await client.get('/ping');
      await accessTokenStorage.clearToken();
      await client.get('/ping');

      expect(captured[0]).toBe('Bearer first');
      expect(captured[1]).toBeNull();
    });
  });

  describe('timeout', () => {
    it('quando atinge o timeout configurado, mapHttpError gera NetworkError (não UnexpectedError)', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/slow`, async () => {
          await delay(500);
          return HttpResponse.json({ ok: true });
        }),
      );

      const client = createHttpClient({ timeoutMs: 50 });

      let mappedError: unknown;
      try {
        await client.get('/slow');
      } catch (err) {
        try {
          mapHttpError(err);
        } catch (mapped) {
          mappedError = mapped;
        }
      }

      expect(mappedError).toBeInstanceOf(NetworkError);
    });
  });
});

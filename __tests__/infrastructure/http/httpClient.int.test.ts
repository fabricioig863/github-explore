import { delay, http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import * as accessTokenStorage from 'src/infra/auth/accessTokenStorage';
import { mapHttpError } from 'src/infra/http/errorMapper';
import { createHttpClient } from 'src/infra/http/httpClient';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

describe('httpClient (HTTP integration via msw)', () => {
  describe('default headers', () => {
    it('sends X-GitHub-Api-Version: 2022-11-28 on every request', async () => {
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

  describe('authentication via the optional access token (accessTokenStorage)', () => {
    afterEach(async () => {
      await accessTokenStorage.clearToken();
    });

    it('does not send Authorization when there is no token', async () => {
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

    it('sends Bearer <token> when a token is stored', async () => {
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

    it('reads the current token on every request, picking up setToken and clear', async () => {
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
    it('maps a timeout to NetworkError, not UnexpectedError', async () => {
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

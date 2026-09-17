import { delay, http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import * as secureTokenStorage from 'src/infra/auth/secureTokenStorage';
import { sessionEvents } from 'src/infra/auth/sessionEvents';
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

  describe('autenticação via token da sessão (secureTokenStorage)', () => {
    afterEach(async () => {
      await secureTokenStorage.clear();
    });

    it('NÃO envia Authorization quando não há token de sessão', async () => {
      await secureTokenStorage.clear();

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
      await secureTokenStorage.setToken('gho_session_token_123');

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

      await secureTokenStorage.setToken('first');
      await client.get('/ping');
      await secureTokenStorage.clear();
      await client.get('/ping');

      expect(captured[0]).toBe('Bearer first');
      expect(captured[1]).toBeNull();
    });
  });

  describe('resposta 401 (token inválido/revogado)', () => {
    afterEach(async () => {
      await secureTokenStorage.clear();
    });

    it('emite sessionExpired e rejeita o erro', async () => {
      const emitSpy = jest.spyOn(sessionEvents, 'emitSessionExpired');
      server.use(
        http.get(`${GITHUB_BASE_URL}/user`, () =>
          HttpResponse.json({ message: 'Bad credentials' }, { status: 401 }),
        ),
      );

      await expect(createHttpClient().get('/user')).rejects.toBeDefined();
      expect(emitSpy).toHaveBeenCalledTimes(1);

      emitSpy.mockRestore();
    });

    it('NÃO emite sessionExpired para respostas não-401', async () => {
      const emitSpy = jest.spyOn(sessionEvents, 'emitSessionExpired');
      server.use(
        http.get(`${GITHUB_BASE_URL}/user`, () =>
          HttpResponse.json({ message: 'forbidden' }, { status: 403 }),
        ),
      );

      await expect(createHttpClient().get('/user')).rejects.toBeDefined();
      expect(emitSpy).not.toHaveBeenCalled();

      emitSpy.mockRestore();
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

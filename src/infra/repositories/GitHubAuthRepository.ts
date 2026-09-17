import axios from 'axios';

import { AuthDeniedError } from '@/domain/errors/AuthError';
import type { AuthSession, IAuthRepository } from '@/domain/repositories/IAuthRepository';
import * as secureTokenStorage from 'src/infra/auth/secureTokenStorage';
import type { GithubUserDto, TokenExchangeResponseDto } from 'src/infra/http/dtos/AuthDtos';
import { mapHttpError } from 'src/infra/http/errorMapper';
import { httpClient } from 'src/infra/http/httpClient';
import { mapAuthenticatedUser } from 'src/infra/http/mappers/authMapper';

function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export class GitHubAuthRepository implements IAuthRepository {
  async signIn(code: string): Promise<AuthSession> {
    const exchange = await this.exchangeCode(code);

    if (exchange.error !== undefined || exchange.access_token === undefined) {
      throw new AuthDeniedError(exchange.error_description);
    }

    // Persiste o token antes de buscar o usuário: o interceptor do httpClient
    // lê o token do cache para autenticar o GET /user.
    await secureTokenStorage.setToken(exchange.access_token);

    const user = await this.fetchUser();
    const session: AuthSession = { token: exchange.access_token, user };
    await secureTokenStorage.setSession(session);
    return session;
  }

  async signOut(): Promise<void> {
    await secureTokenStorage.clear();
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const stored = await secureTokenStorage.getSession();
    if (stored === null) return null;

    try {
      // GET /user direto (não via fetchUser) para inspecionar o 401 cru antes
      // que o mapHttpError o transforme em UnexpectedError.
      const response = await httpClient.get<GithubUserDto>('/user');
      const user = mapAuthenticatedUser(response.data);
      const session: AuthSession = { token: stored.token, user };
      await secureTokenStorage.setSession(session);
      return session;
    } catch (err) {
      if (isUnauthorized(err)) {
        await secureTokenStorage.clear();
        return null;
      }
      mapHttpError(err);
    }
  }

  private async exchangeCode(code: string): Promise<TokenExchangeResponseDto> {
    const proxyUrl = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL ?? '';
    if (proxyUrl.length === 0) {
      throw new AuthDeniedError(
        'EXPO_PUBLIC_OAUTH_PROXY_URL não configurada — reinicie o Metro com -c após editar a .env.',
      );
    }
    try {
      const response = await httpClient.post<TokenExchangeResponseDto>(
        proxyUrl,
        { code },
        { baseURL: '' },
      );
      return response.data;
    } catch (err) {
      mapHttpError(err, 'Autenticação');
    }
  }

  private async fetchUser() {
    try {
      const response = await httpClient.get<GithubUserDto>('/user');
      return mapAuthenticatedUser(response.data);
    } catch (err) {
      mapHttpError(err, 'Usuário');
    }
  }
}

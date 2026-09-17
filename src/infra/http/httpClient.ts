import axios, { type AxiosInstance } from 'axios';

import { getCachedToken } from 'src/infra/auth/secureTokenStorage';
import { sessionEvents } from 'src/infra/auth/sessionEvents';

const GITHUB_API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15000;

export interface CreateHttpClientOptions {
  timeoutMs?: number;
}

export function createHttpClient(options: CreateHttpClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL: GITHUB_API_BASE,
    timeout: options.timeoutMs ?? REQUEST_TIMEOUT_MS,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  // Injeta o token da sessão corrente (SecureStore) lido do cache em memória —
  // sem await por request. Token ausente → request anônima.
  client.interceptors.request.use((config) => {
    const token = getCachedToken();
    if (token !== null && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 401 = token inválido/revogado (distinto de rate limit, que é 403/429).
  // Emite sessionExpired para a apresentação forçar logout.
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        sessionEvents.emitSessionExpired();
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const httpClient = createHttpClient();

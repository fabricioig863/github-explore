import axios, { type AxiosInstance } from 'axios';

import { getCachedToken } from 'src/infra/auth/accessTokenStorage';

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

  client.interceptors.request.use((config) => {
    const token = getCachedToken();
    if (token !== null && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

export const httpClient = createHttpClient();

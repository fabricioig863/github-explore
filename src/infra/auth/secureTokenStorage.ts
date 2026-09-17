import * as SecureStore from 'expo-secure-store';

import type { AuthenticatedUser } from '@/domain/entities/AuthenticatedUser';
import type { AuthSession } from '@/domain/repositories/IAuthRepository';

// SecureStore só aceita keys alfanuméricas + ".", "-", "_" (sem ":").
const TOKEN_KEY = 'octolens.token';
const USER_KEY = 'octolens.user';

// Cache em memória para o interceptor do httpClient ler o token de forma
// síncrona, sem um await por request. É preenchido em toda leitura/escrita.
let cachedToken: string | null = null;

/** Token corrente em memória (síncrono). Pode estar desatualizado até o primeiro `getSession`. */
export function getCachedToken(): string | null {
  return cachedToken;
}

/** Lê a sessão persistida. Tolera storage corrompido → devolve null. */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token === null || token.length === 0) {
      cachedToken = null;
      return null;
    }
    cachedToken = token;

    const rawUser = await SecureStore.getItemAsync(USER_KEY);
    if (rawUser === null) return null;

    const user = JSON.parse(rawUser) as AuthenticatedUser;
    return { token, user };
  } catch {
    cachedToken = null;
    return null;
  }
}

/** Persiste só o token (usado entre a troca de code e a hidratação do usuário). */
export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/** Persiste a sessão completa (token + usuário). */
export async function setSession(session: AuthSession): Promise<void> {
  cachedToken = session.token;
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
}

/** Limpa token e usuário do storage e do cache. */
export async function clear(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

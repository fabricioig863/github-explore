import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'octolens.token';

let cachedToken: string | null = null;

export function getCachedToken(): string | null {
  return cachedToken;
}

export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    cachedToken = token !== null && token.length > 0 ? token : null;
    return cachedToken;
  } catch {
    cachedToken = null;
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  const trimmed = token.trim();
  cachedToken = trimmed;
  await SecureStore.setItemAsync(TOKEN_KEY, trimmed);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

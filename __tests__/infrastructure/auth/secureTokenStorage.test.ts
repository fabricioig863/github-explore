import * as SecureStore from 'expo-secure-store';

import * as storage from 'src/infra/auth/secureTokenStorage';

const getItem = SecureStore.getItemAsync as jest.Mock;
const setItem = SecureStore.setItemAsync as jest.Mock;
const deleteItem = SecureStore.deleteItemAsync as jest.Mock;

const USER = {
  id: 1,
  login: 'octocat',
  name: 'The Octocat',
  email: null,
  avatarUrl: 'a',
  bio: null,
  publicReposCount: 0,
  followers: 0,
  following: 0,
};

describe('secureTokenStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await storage.clear();
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('devolve null e zera o cache quando não há token', async () => {
      getItem.mockResolvedValueOnce(null);

      expect(await storage.getSession()).toBeNull();
      expect(storage.getCachedToken()).toBeNull();
    });

    it('devolve token+user e popula o cache', async () => {
      getItem.mockResolvedValueOnce('tok').mockResolvedValueOnce(JSON.stringify(USER));

      const session = await storage.getSession();

      expect(session?.token).toBe('tok');
      expect(session?.user.login).toBe('octocat');
      expect(storage.getCachedToken()).toBe('tok');
    });

    it('devolve null quando há token mas o usuário está ausente', async () => {
      getItem.mockResolvedValueOnce('tok').mockResolvedValueOnce(null);

      expect(await storage.getSession()).toBeNull();
      // token ainda popula o cache (usado pelo interceptor)
      expect(storage.getCachedToken()).toBe('tok');
    });

    it('tolera JSON de usuário corrompido → null', async () => {
      getItem.mockResolvedValueOnce('tok').mockResolvedValueOnce('{not json');

      expect(await storage.getSession()).toBeNull();
    });

    it('tolera erro de leitura do SecureStore → null e cache zerado', async () => {
      getItem.mockRejectedValueOnce(new Error('keychain locked'));

      expect(await storage.getSession()).toBeNull();
      expect(storage.getCachedToken()).toBeNull();
    });
  });

  describe('setToken', () => {
    it('persiste o token e atualiza o cache', async () => {
      await storage.setToken('abc');

      expect(setItem).toHaveBeenCalledWith('octolens.token', 'abc');
      expect(storage.getCachedToken()).toBe('abc');
    });
  });

  describe('setSession', () => {
    it('persiste token + usuário (serializado) e atualiza o cache', async () => {
      await storage.setSession({ token: 'xyz', user: USER });

      expect(setItem).toHaveBeenCalledWith('octolens.token', 'xyz');
      expect(setItem).toHaveBeenCalledWith('octolens.user', JSON.stringify(USER));
      expect(storage.getCachedToken()).toBe('xyz');
    });
  });

  describe('clear', () => {
    it('apaga token + usuário e zera o cache', async () => {
      await storage.setToken('abc');
      await storage.clear();

      expect(deleteItem).toHaveBeenCalledWith('octolens.token');
      expect(deleteItem).toHaveBeenCalledWith('octolens.user');
      expect(storage.getCachedToken()).toBeNull();
    });
  });
});

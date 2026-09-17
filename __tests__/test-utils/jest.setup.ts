import { notifyManager } from '@tanstack/react-query';

import { server } from './msw/server';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Módulos nativos do fluxo de auth — mockados para rodar fora do device.
// SecureStore: store em memória com estado real (persiste entre chamadas no arquivo).
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

notifyManager.setScheduler((cb) => cb());

// expo-router: só o que as telas consomem. Os objetos vêm de um módulo à parte
// para que os testes possam inspecioná-los e redefinir os parâmetros de rota.
jest.mock('expo-router', () => {
  const mock = require('./expoRouter');
  return {
    useRouter: () => mock.routerMock,
    useNavigation: () => mock.navigationMock,
    useLocalSearchParams: () => mock.getSearchParams(),
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

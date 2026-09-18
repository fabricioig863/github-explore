import { act, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

// O jest.setup troca expo-router inteiro por três hooks, o que serve às telas
// isoladas mas apaga Stack/Redirect. Aqui o alvo do teste é o próprio roteador,
// então usamos o módulo real.
jest.unmock('expo-router');

// O layout raiz puxa Reactotron, fontes e splash — nenhum deles importa para o
// que este teste verifica (para onde o roteador vai quando o guard troca).
jest.mock('src/infra/reactotron/ReactotronConfig', () => ({}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock('src/infra/theme/fonts', () => ({
  useAppFonts: () => [true, null],
}));

// A sessão precisa disparar re-render de verdade: mutar um objeto solto não
// reagenda nada no React, e o guard do Stack.Protected ficaria congelado.
const mockListeners = new Set<() => void>();
let mockAuthenticated = false;

jest.mock('@/presentation/hooks/useAuthSession', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- fábrica de jest.mock é hoisted, não enxerga imports
  const { useEffect, useState } = require('react');
  return {
    useAuthSession: () => {
      const [, force] = useState(0);
      useEffect(() => {
        const listener = () => force((n: number) => n + 1);
        mockListeners.add(listener);
        return () => {
          mockListeners.delete(listener);
        };
      }, []);
      return { session: null, isAuthenticated: mockAuthenticated, isHydrating: false };
    },
  };
});

async function signIn() {
  await act(async () => {
    mockAuthenticated = true;
    mockListeners.forEach((l) => {
      l();
    });
  });
}

beforeEach(() => {
  mockAuthenticated = false;
});

// Os grupos precisam dos _layout reais: sem eles o roteador monta o grupo sem
// navegador e nenhuma tela do grupo chega a renderizar.
function buildRoutes() {
  /* eslint-disable @typescript-eslint/no-require-imports */
  return {
    _layout: require('src/app/_layout').default,
    redirect: require('src/app/redirect').default,
    '(auth)/_layout': require('src/app/(auth)/_layout').default,
    '(auth)/index': () => <Text>tela-de-login</Text>,
    '(tabs)/_layout': require('src/app/(tabs)/_layout').default,
    '(tabs)/index': () => <Text>tela-principal</Text>,
    '(tabs)/design': () => <Text>design</Text>,
    '(tabs)/saved': () => <Text>salvos</Text>,
    '(tabs)/profile': () => <Text>perfil</Text>,
  };
  /* eslint-enable @typescript-eslint/no-require-imports */
}

describe('retorno do OAuth em /redirect', () => {
  it('existe como rota: o deep link não cai em Unmatched route', async () => {
    renderRouter(buildRoutes(), { initialUrl: '/redirect' });
    await act(async () => {});

    expect(screen.queryByText('Unmatched Route')).toBeNull();
  });

  it('deslogado, manda para a tela de login', async () => {
    renderRouter(buildRoutes(), { initialUrl: '/redirect' });
    await act(async () => {});

    expect(screen.getByText('tela-de-login')).toBeTruthy();
  });

  it('quando a sessão fica válida, chega na tela principal', async () => {
    renderRouter(buildRoutes(), { initialUrl: '/redirect' });
    await act(async () => {});

    await signIn();

    expect(screen.getByText('tela-principal')).toBeTruthy();
  });
});

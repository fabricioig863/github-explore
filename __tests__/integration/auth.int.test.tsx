import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAuthSession } from '@/presentation/hooks/useAuthSession';
import { AuthScreen } from '@/presentation/screens/AuthScreen/AuthScreen';
import { container } from 'src/infra/di/bootstrap';
import { lightTheme } from 'src/infra/theme/lightTheme';

import { createTestQueryClient } from '../test-utils/renderWithProviders';

// Fluxo OAuth: simula o usuário autorizando e o GitHub devolvendo um code.
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'octolens://redirect'),
  useAuthRequest: jest.fn(() => [
    { url: 'https://github.com/login/oauth/authorize' },
    null,
    jest.fn(async () => ({ type: 'success', params: { code: 'test-code' } })),
  ]),
}));

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RestyleThemeProvider theme={lightTheme}>{children}</RestyleThemeProvider>
    </QueryClientProvider>
  );
}

describe('vertical slice: AuthScreen → useSignInWithGithub → use case → InMemoryAuthRepository', () => {
  beforeEach(async () => {
    // Garante que a sessão começa deslogada (InMemoryAuthRepository é singleton no container).
    await container.signOutUseCase.execute();
  });

  it('parte deslogado: useAuthSession reflete isAuthenticated=false', async () => {
    const client = createTestQueryClient();
    const wrapper = makeWrapper(client);

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('tap em "Continuar com GitHub" autentica e useAuthSession passa a isAuthenticated=true', async () => {
    const client = createTestQueryClient();
    const wrapper = makeWrapper(client);

    const sessionHook = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(sessionHook.result.current.isHydrating).toBe(false));
    expect(sessionHook.result.current.isAuthenticated).toBe(false);

    const screen = render(<AuthScreen />, { wrapper });

    await act(async () => {
      fireEvent.press(screen.getByText('Continuar com GitHub'));
    });

    await waitFor(() => expect(sessionHook.result.current.isAuthenticated).toBe(true));
    expect(sessionHook.result.current.session?.user.login).toBe('octocat');

    // o repositório também reflete a sessão
    expect(await container.getCurrentSessionUseCase.execute()).not.toBeNull();
  });
});

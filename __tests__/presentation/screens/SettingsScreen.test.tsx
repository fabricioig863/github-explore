import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '@/presentation/screens/SettingsScreen/SettingsScreen';
import * as accessTokenStorage from 'src/infra/auth/accessTokenStorage';
import { container } from 'src/infra/di/bootstrap';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('src/infra/di/bootstrap', () => ({
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

jest.mock('src/infra/theme/AppThemeProvider', () => ({
  useThemeMode: () => ({
    mode: 'light',
    resolvedScheme: 'light',
    setMode: jest.fn(),
    isHydrated: true,
  }),
}));

const getPrefs = container.getUserPreferencesUseCase.execute as jest.Mock;

describe('SettingsScreen', () => {
  beforeEach(async () => {
    getPrefs.mockReset().mockResolvedValue({ localAvatarUri: null });
    await accessTokenStorage.clearToken();
  });

  it('shows the anonymous limit and the input when there is no token', async () => {
    renderWithProviders(<SettingsScreen />);

    expect(await screen.findByText('Token de acesso')).toBeTruthy();
    expect(screen.getByText('Anônimo · 60 requisições por hora')).toBeTruthy();
    expect(screen.getByText('Opcional')).toBeTruthy();
    expect(screen.getByLabelText('Personal Access Token do GitHub')).toBeTruthy();
  });

  it('saving a token persists it in secure storage', async () => {
    renderWithProviders(<SettingsScreen />);

    const input = await screen.findByLabelText('Personal Access Token do GitHub');
    fireEvent.changeText(input, 'ghp_token_de_teste');
    fireEvent.press(screen.getByText('Salvar token'));

    await waitFor(async () => {
      expect(await accessTokenStorage.getToken()).toBe('ghp_token_de_teste');
    });
  });

  it('swaps the input for a remove action once a token is stored', async () => {
    await accessTokenStorage.setToken('ghp_ja_configurado');
    renderWithProviders(<SettingsScreen />);

    expect(await screen.findByText('Configurado')).toBeTruthy();
    expect(screen.getByText('Limite de 5.000 requisições por hora')).toBeTruthy();
    expect(screen.queryByLabelText('Personal Access Token do GitHub')).toBeNull();

    fireEvent.press(screen.getByText('Remover token'));

    await waitFor(async () => {
      expect(await accessTokenStorage.getToken()).toBeNull();
    });
  });

  it('keeps the theme control', async () => {
    renderWithProviders(<SettingsScreen />);

    expect(await screen.findByText('Tema escuro')).toBeTruthy();
  });

  it('no longer offers a sign-out action', async () => {
    renderWithProviders(<SettingsScreen />);

    await screen.findByText('Token de acesso');
    expect(screen.queryByText('Sair da conta')).toBeNull();
  });
});

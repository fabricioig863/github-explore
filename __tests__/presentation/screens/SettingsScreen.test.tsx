import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { AuthSession } from '@/domain/repositories/IAuthRepository';
import { SettingsScreen } from '@/presentation/screens/SettingsScreen/SettingsScreen';
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

const SESSION: AuthSession = {
  token: 't',
  user: {
    id: 1,
    login: 'octocat',
    name: 'The Octocat',
    email: 'octo@github.com',
    avatarUrl: 'https://x/a.png',
    bio: null,
    publicReposCount: 8,
    followers: 9999,
    following: 9,
  },
};

const getSession = container.getCurrentSessionUseCase.execute as jest.Mock;
const getPrefs = container.getUserPreferencesUseCase.execute as jest.Mock;
const signOut = container.signOutUseCase.execute as jest.Mock;

describe('SettingsScreen', () => {
  beforeEach(() => {
    getSession.mockReset().mockResolvedValue(SESSION);
    getPrefs.mockReset().mockResolvedValue({ localAvatarUri: null });
    signOut.mockReset().mockResolvedValue(undefined);
  });

  it('renderiza todas as linhas com os dados do usuário', async () => {
    renderWithProviders(<SettingsScreen />);

    await screen.findByText('Nome');
    expect(screen.getByText('Usuário')).toBeTruthy();
    expect(screen.getByText('E-mail')).toBeTruthy();
    expect(screen.getByText('@octocat')).toBeTruthy();
    expect(screen.getByText('Tema escuro')).toBeTruthy();
    expect(screen.getByText('Conta GitHub')).toBeTruthy();
    expect(screen.getByText('Conectada')).toBeTruthy();
    expect(screen.getByText('Sair da conta')).toBeTruthy();
  });

  it('tocar em "Sair da conta" chama o signOut use case', async () => {
    renderWithProviders(<SettingsScreen />);

    fireEvent.press(await screen.findByText('Sair da conta'));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });
});

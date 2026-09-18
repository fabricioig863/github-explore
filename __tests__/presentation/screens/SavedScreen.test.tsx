import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SavedScreen } from '@/presentation/screens/SavedScreen';
import { container } from 'src/infra/di/bootstrap';

import { makeSavedRepo } from '../../test-utils/fixtures/savedRepo.fixture';
import { resetExpoRouterMock, routerMock } from '../../test-utils/expoRouter';
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

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const listMock = container.listSavedReposUseCase.execute as jest.Mock;

describe('SavedScreen', () => {
  beforeEach(() => {
    resetExpoRouterMock();
    listMock.mockReset();
  });

  it('renders the header and the three segmented tabs with total count', async () => {
    listMock.mockResolvedValueOnce([
      makeSavedRepo({ id: 1 }),
      makeSavedRepo({ id: 2, fullName: 'a/b', name: 'b' }),
    ]);
    renderWithProviders(<SavedScreen />);

    expect(screen.getByText('Salvos')).toBeTruthy();
    expect(screen.getByText('Coleções')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Todos · 2')).toBeTruthy());
    expect(screen.getByText('Recentes')).toBeTruthy();
  });

  it('renders the five pre-defined collections with their counts', async () => {
    const neutral = { fullName: 'alguem/coisa', name: 'coisa', ownerLogin: 'alguem' };
    listMock.mockResolvedValueOnce([
      makeSavedRepo({ ...neutral, id: 1, language: 'Swift' }),
      makeSavedRepo({ ...neutral, id: 2, language: 'Kotlin' }),
      makeSavedRepo({ ...neutral, id: 3, language: 'Go' }),
    ]);
    renderWithProviders(<SavedScreen />);

    await waitFor(() => expect(screen.getByText('Mobile')).toBeTruthy());
    expect(screen.getByText('Backend')).toBeTruthy();
    expect(screen.getByText('Web')).toBeTruthy();
    expect(screen.getByText('Ferramentas')).toBeTruthy();
    expect(screen.getByText('AI & ML')).toBeTruthy();
    expect(screen.getByText('2 repos')).toBeTruthy();
    expect(screen.getByText('1 repo')).toBeTruthy();
  });

  it('shows empty state copy when there are no saved repos and Todos tab is active', async () => {
    listMock.mockResolvedValueOnce([]);
    renderWithProviders(<SavedScreen />);

    await waitFor(() => expect(screen.getByText('Todos · 0')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Todos · 0'));
    expect(screen.getByText('Você ainda não salvou nenhum repositório')).toBeTruthy();
  });

  it('opens the repo detail when a row is pressed', async () => {
    listMock.mockResolvedValueOnce([
      makeSavedRepo({
        id: 1,
        fullName: 'facebook/react-native',
        name: 'react-native',
        ownerLogin: 'facebook',
      }),
    ]);

    renderWithProviders(<SavedScreen />);

    await waitFor(() => expect(screen.getByText('Todos · 1')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Recentes'));
    const row = await screen.findByText('react-native');
    fireEvent.press(row);

    expect(routerMock.push).toHaveBeenCalledWith('/facebook/react-native');
  });
});

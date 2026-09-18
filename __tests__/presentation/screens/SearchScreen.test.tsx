import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { NetworkError } from '@/domain/errors/NetworkError';
import { SearchScreen } from '@/presentation/screens/SearchScreen/SearchScreen';
import { container } from 'src/infra/di/bootstrap';

import { makeRepository } from '../../test-utils/fixtures/repository.fixture';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('src/infra/di/bootstrap', () => ({
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

const executeMock = container.searchReposUseCase.execute as jest.Mock;

function renderScreen() {
  return renderWithProviders(<SearchScreen />);
}

describe('SearchScreen', () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockResolvedValue({ items: [], totalCount: 0, hasNextPage: false });
  });

  it('queries the Trending pill on mount, with no typing', async () => {
    renderScreen();

    await waitFor(() => expect(executeMock).toHaveBeenCalled(), { timeout: 2000 });
    expect(executeMock).toHaveBeenCalledWith({ query: 'stars:>10000', page: 1, perPage: 20 });
  });

  it('typed text of two or more characters overrides the selected pill', async () => {
    executeMock.mockResolvedValue({
      items: [makeRepository({ id: 1, name: 'react-native', fullName: 'fb/react-native' })],
      totalCount: 1,
      hasNextPage: false,
    });

    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('react native, typescript...'), 'react');

    await waitFor(
      () => expect(executeMock).toHaveBeenCalledWith({ query: 'react', page: 1, perPage: 20 }),
      { timeout: 2000 },
    );
    await screen.findByText('react-native', {}, { timeout: 2000 });
    expect(screen.getByText('Top resultados · 1')).toBeTruthy();
  });

  it('renders path-aware empty copy when an owner/repo query returns nothing', async () => {
    executeMock.mockResolvedValue({ items: [], totalCount: 0, hasNextPage: false });

    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('react native, typescript...'),
      'openai/missing-repo',
    );

    await screen.findByText(/owner\/repositório/, {}, { timeout: 2000 });
  });

  it('renders the error empty state when the use case rejects', async () => {
    executeMock.mockRejectedValue(new NetworkError());

    renderScreen();

    await screen.findByText('Algo deu errado', {}, { timeout: 2000 });
    expect(screen.getByText('Sem conexão. Verifique sua internet e tente novamente.')).toBeTruthy();
  });
});

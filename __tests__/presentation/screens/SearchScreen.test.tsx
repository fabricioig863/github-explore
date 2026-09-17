import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { NetworkError } from '@/domain/errors/NetworkError';
import { SearchScreen } from '@/presentation/screens/SearchScreen';
import { container } from 'src/infra/di/bootstrap';

import { makeRepository } from '../../test-utils/fixtures/repository.fixture';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('src/infra/di/bootstrap', () => ({
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

const executeMock = container.searchReposUseCase.execute as jest.Mock;

function renderScreen() {
  return renderWithProviders(
    <SearchScreen />,
  );
}

describe('SearchScreen', () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockResolvedValue({ items: [], totalCount: 0, hasNextPage: false });
  });

  it('busca a pill Trending no mount (sem digitar nada)', async () => {
    renderScreen();

    await waitFor(() => expect(executeMock).toHaveBeenCalled(), { timeout: 2000 });
    expect(executeMock).toHaveBeenCalledWith({ query: 'stars:>10000', page: 1, perPage: 20 });
  });

  it('texto digitado (>= 2 chars) sobrepõe a pill selecionada', async () => {
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

  it('renderiza copy de vazio ciente de path quando owner/repo não retorna nada', async () => {
    executeMock.mockResolvedValue({ items: [], totalCount: 0, hasNextPage: false });

    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('react native, typescript...'),
      'openai/missing-repo',
    );

    // Espera a descrição específica de path (a genérica do mount aparece antes).
    await screen.findByText(/owner\/repositório/, {}, { timeout: 2000 });
  });

  it('renderiza EmptyState de erro com mensagem pt-BR quando o use case rejeita', async () => {
    executeMock.mockRejectedValue(new NetworkError());

    renderScreen();

    await screen.findByText('Algo deu errado', {}, { timeout: 2000 });
    expect(screen.getByText('Sem conexão. Verifique sua internet e tente novamente.')).toBeTruthy();
  });
});

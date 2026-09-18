import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SearchScreen } from '@/presentation/screens/SearchScreen/SearchScreen';
import { container } from 'src/infra/di/bootstrap';

import { renderWithProviders } from '../test-utils/renderWithProviders';

describe('vertical slice: PillRow → useExplorePills → repoQueries.search → SearchReposUseCase', () => {
  const executeSpy = jest.spyOn(container.searchReposUseCase, 'execute');

  beforeEach(() => executeSpy.mockClear());
  afterAll(() => executeSpy.mockRestore());

  it('tocar na pill "Rust" dispara a busca com query "language:rust"', async () => {
    renderWithProviders(<SearchScreen />);

    fireEvent.press(screen.getByText('Rust'));

    await waitFor(
      () =>
        expect(executeSpy).toHaveBeenCalledWith({
          query: 'language:rust',
          page: 1,
          perPage: 20,
        }),
      { timeout: 2000 },
    );
  });
});

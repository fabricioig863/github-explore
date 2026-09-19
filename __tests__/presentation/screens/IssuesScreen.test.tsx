import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { IssuesScreen } from '@/presentation/screens/IssuesScreen/IssuesScreen';
import { container } from 'src/infra/di/bootstrap';

import { setSearchParams } from '../../test-utils/expoRouter';
import { makeIssue } from '../../test-utils/fixtures/issue.fixture';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('src/infra/di/bootstrap', () => ({
  container: require('../../test-utils/fakes/makeFakeContainer').makeFakeContainer(),
}));

const listMock = container.listIssuesUseCase.execute as jest.Mock;
const countMock = container.countIssuesUseCase.execute as jest.Mock;

function renderScreen() {
  setSearchParams({ owner: 'foo', repo: 'bar' });
  return renderWithProviders(<IssuesScreen />);
}

describe('IssuesScreen', () => {
  beforeEach(() => {
    listMock.mockReset();
    countMock.mockReset();
  });

  it('renders the list, the open header and both pills with counts', async () => {
    listMock.mockResolvedValue({
      items: [makeIssue({ id: 1, title: 'First issue' })],
      totalCount: 50,
      hasNextPage: false,
    });
    countMock.mockImplementation(({ state }: { state: 'open' | 'closed' }) =>
      Promise.resolve(state === 'open' ? 50 : 8900),
    );

    renderScreen();

    await screen.findByText('First issue');
    await waitFor(() => expect(screen.getByText('Abertas · 50')).toBeTruthy());
    expect(screen.getByText('Fechadas · 8.9k')).toBeTruthy();
  });

  it('tapping the "Fechadas" pill switches the list to state=closed', async () => {
    listMock.mockImplementation(({ state }: { state: 'open' | 'closed' }) =>
      Promise.resolve({
        items: [makeIssue({ id: state === 'open' ? 1 : 2, title: `${state} issue` })],
        totalCount: 1,
        hasNextPage: false,
      }),
    );
    countMock.mockImplementation(({ state }: { state: 'open' | 'closed' }) =>
      Promise.resolve(state === 'open' ? 3 : 9),
    );

    renderScreen();

    await screen.findByText('open issue');

    fireEvent.press(screen.getByText(/Fechadas/));

    await screen.findByText('closed issue');
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }));
  });

  it('renders the empty state when there are no open issues', async () => {
    listMock.mockResolvedValue({ items: [], totalCount: 0, hasNextPage: false });
    countMock.mockResolvedValue(0);

    renderScreen();

    await screen.findByText('Nenhuma issue aberta');
    expect(screen.getByText('foo/bar não possui issues abertas no momento.')).toBeTruthy();
  });
});

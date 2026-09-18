import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ProfileScreen } from '@/presentation/screens/ProfileScreen/ProfileScreen';
import { container } from 'src/infra/di/bootstrap';

import { renderWithProviders } from '../test-utils/renderWithProviders';

describe('vertical slice: ProfileScreen → userQueries → InMemory repos', () => {
  const profileSpy = jest.spyOn(container.getUserProfileUseCase, 'execute');
  const topReposSpy = jest.spyOn(container.getTopUserReposUseCase, 'execute');

  beforeEach(() => {
    profileSpy.mockClear();
    topReposSpy.mockClear();
  });

  afterAll(() => {
    profileSpy.mockRestore();
    topReposSpy.mockRestore();
  });

  it('opens on the default login, showing the profile and pinned repos', async () => {
    renderWithProviders(<ProfileScreen />);

    await screen.findByText('The Octocat', {}, { timeout: 2000 });
    expect(screen.getByText('@octocat')).toBeTruthy();

    await waitFor(() => expect(topReposSpy).toHaveBeenCalledWith('octocat'), { timeout: 2000 });
  });

  it('searching another user re-runs both queries with the new login', async () => {
    renderWithProviders(<ProfileScreen />);
    await screen.findByText('The Octocat', {}, { timeout: 2000 });

    const input = screen.getByLabelText('Buscar usuário do GitHub');
    fireEvent.changeText(input, 'torvalds');
    fireEvent(input, 'submitEditing');

    await waitFor(() => expect(profileSpy).toHaveBeenCalledWith('torvalds'), { timeout: 2000 });
    await waitFor(() => expect(topReposSpy).toHaveBeenCalledWith('torvalds'), { timeout: 2000 });
  });

  it('ignores a blank search', async () => {
    renderWithProviders(<ProfileScreen />);
    await screen.findByText('The Octocat', {}, { timeout: 2000 });
    profileSpy.mockClear();

    const input = screen.getByLabelText('Buscar usuário do GitHub');
    fireEvent.changeText(input, '   ');
    fireEvent(input, 'submitEditing');

    expect(profileSpy).not.toHaveBeenCalled();
  });
});

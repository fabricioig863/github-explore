import { screen, waitFor } from '@testing-library/react-native';

import { ProfileScreen } from '@/presentation/screens/ProfileScreen/ProfileScreen';
import { container } from 'src/infra/di/bootstrap';

import { renderWithProviders } from '../test-utils/renderWithProviders';

describe('vertical slice: ProfileScreen → useAuthSession + userQueries → InMemory repos', () => {
  const topReposSpy = jest.spyOn(container.getTopUserReposUseCase, 'execute');

  beforeEach(async () => {
    topReposSpy.mockClear();
    // Hidrata uma sessão fictícia (InMemoryAuthRepository).
    await container.signInWithGithubUseCase.execute('dev-code');
  });

  afterEach(async () => {
    await container.signOutUseCase.execute();
  });

  afterAll(() => topReposSpy.mockRestore());

  it('mostra nome/handle/bio do usuário e busca os repos em destaque', async () => {
    renderWithProviders(
      <ProfileScreen
      />,
    );

    await screen.findByText('The Octocat', {}, { timeout: 2000 });
    expect(screen.getByText('@octocat')).toBeTruthy();

    await waitFor(() => expect(topReposSpy).toHaveBeenCalledWith('octocat'), { timeout: 2000 });
  });
});

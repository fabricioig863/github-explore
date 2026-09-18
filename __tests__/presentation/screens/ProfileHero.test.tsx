import type { GitHubUser } from '@/domain/entities/GitHubUser';
import { ProfileHero } from '@/presentation/screens/ProfileScreen/components/ProfileHero';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

const USER: GitHubUser = {
  id: 1,
  login: 'octocat',
  name: 'The Octocat',
  email: null,
  avatarUrl: 'https://x/a.png',
  bio: 'Mascote do GitHub',
  publicReposCount: 8,
  followers: 9999,
  following: 9,
};

describe('ProfileHero', () => {
  it('renders name, handle, bio and the three stats', () => {
    const { getByText } = renderWithProviders(<ProfileHero user={USER} />);

    expect(getByText('The Octocat')).toBeTruthy();
    expect(getByText('@octocat')).toBeTruthy();
    expect(getByText('Mascote do GitHub')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
    expect(getByText('repositórios')).toBeTruthy();
    expect(getByText('seguidores')).toBeTruthy();
    expect(getByText('seguindo')).toBeTruthy();
  });

  it('falls back to the login as the title when name is null', () => {
    const { getByText } = renderWithProviders(<ProfileHero user={{ ...USER, name: null }} />);

    expect(getByText('octocat')).toBeTruthy();
  });
});

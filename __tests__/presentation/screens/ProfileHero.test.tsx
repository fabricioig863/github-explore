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
  it('renderiza nome, handle, bio e os três stats', () => {
    const { getByText } = renderWithProviders(<ProfileHero user={USER} />);

    expect(getByText('The Octocat')).toBeTruthy();
    expect(getByText('@octocat')).toBeTruthy();
    expect(getByText('Mascote do GitHub')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
    expect(getByText('repositórios')).toBeTruthy();
    expect(getByText('seguidores')).toBeTruthy();
    expect(getByText('seguindo')).toBeTruthy();
  });

  it('usa o login como título quando name é null', () => {
    const { getByText } = renderWithProviders(<ProfileHero user={{ ...USER, name: null }} />);

    expect(getByText('octocat')).toBeTruthy();
  });
});

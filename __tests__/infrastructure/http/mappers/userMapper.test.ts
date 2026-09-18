import { mapGitHubUser } from 'src/infra/http/mappers/userMapper';

describe('authMapper', () => {
  it('maps snake_case to camelCase, including the profile fields', () => {
    const user = mapGitHubUser({
      id: 1,
      login: 'octocat',
      name: 'The Octocat',
      email: 'octo@github.com',
      avatar_url: 'https://x/y.png',
      bio: 'hi',
      public_repos: 8,
      followers: 9999,
      following: 9,
    });

    expect(user).toEqual({
      id: 1,
      login: 'octocat',
      name: 'The Octocat',
      email: 'octo@github.com',
      avatarUrl: 'https://x/y.png',
      bio: 'hi',
      publicReposCount: 8,
      followers: 9999,
      following: 9,
    });
  });

  it('propagates null in name, email and bio without coercing', () => {
    const user = mapGitHubUser({
      id: 2,
      login: 'ghost',
      name: null,
      email: null,
      avatar_url: 'a',
      bio: null,
      public_repos: 0,
      followers: 0,
      following: 0,
    });

    expect(user.name).toBeNull();
    expect(user.email).toBeNull();
    expect(user.bio).toBeNull();
    expect(user).not.toHaveProperty('avatar_url');
    expect(user).not.toHaveProperty('public_repos');
  });
});

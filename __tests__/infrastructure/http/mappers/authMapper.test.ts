import { mapAuthenticatedUser } from 'src/infra/http/mappers/authMapper';

describe('authMapper', () => {
  it('mapeia snake_case -> camelCase incluindo os campos de perfil', () => {
    const user = mapAuthenticatedUser({
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

  it('propaga null em name/email/bio sem coagir', () => {
    const user = mapAuthenticatedUser({
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

import { http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { GitHubUserRepository } from 'src/infra/repositories/GitHubUserRepository';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

function makeRepoDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'react',
    full_name: 'facebook/react',
    owner: {
      id: 69631,
      login: 'facebook',
      avatar_url: 'https://x/a.png',
      type: 'Organization' as const,
    },
    description: 'A library',
    stargazers_count: 1000,
    forks_count: 50,
    watchers_count: 1000,
    open_issues_count: 5,
    language: 'JavaScript',
    html_url: 'https://github.com/facebook/react',
    pushed_at: '2026-04-15T10:00:00Z',
    topics: [],
    license: { name: 'MIT', spdx_id: 'MIT' },
    ...overrides,
  };
}

describe('GitHubUserRepository (HTTP integration via msw)', () => {
  describe('listUserRepos', () => {
    it('sends GET /users/:login/repos with sort, page and per_page, and maps the DTOs', async () => {
      let capturedUrl: URL | undefined;
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json([makeRepoDto({ id: 1, name: 'react' })]);
        }),
      );

      const result = await new GitHubUserRepository().listUserRepos({
        login: 'facebook',
        page: 1,
        perPage: 30,
      });

      expect(capturedUrl?.pathname).toBe('/users/facebook/repos');
      expect(capturedUrl?.searchParams.get('sort')).toBe('updated');
      expect(capturedUrl?.searchParams.get('page')).toBe('1');
      expect(capturedUrl?.searchParams.get('per_page')).toBe('30');
      expect(result.items[0]?.name).toBe('react');
      expect(result.items[0]?.pushedAt).toBeInstanceOf(Date);
      expect(result.items[0]).not.toHaveProperty('stargazers_count');
    });

    it.each([
      ['página cheia (=perPage) → hasNextPage true', 2, true],
      ['página parcial (<perPage) → hasNextPage false', 1, false],
    ])('infere hasNextPage pelo tamanho: %s', async (_label, count, expected) => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () =>
          HttpResponse.json(Array.from({ length: count }, (_, i) => makeRepoDto({ id: i }))),
        ),
      );

      const result = await new GitHubUserRepository().listUserRepos({
        login: 'facebook',
        page: 1,
        perPage: 2,
      });

      expect(result.hasNextPage).toBe(expected);
    });

    it('raises NotFoundError on 404 with the user-repos resource context', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () =>
          HttpResponse.json({ message: 'not found' }, { status: 404 }),
        ),
      );

      const promise = new GitHubUserRepository().listUserRepos({
        login: 'ghost',
        page: 1,
        perPage: 30,
      });
      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await promise.catch((err: NotFoundError) => {
        expect(err.message).toContain('Repositórios de ghost');
      });
    });

    it('raises NetworkError on a network failure', async () => {
      server.use(http.get(`${GITHUB_BASE_URL}/users/:login/repos`, () => HttpResponse.error()));

      await expect(
        new GitHubUserRepository().listUserRepos({ login: 'facebook', page: 1, perPage: 30 }),
      ).rejects.toBeInstanceOf(NetworkError);
    });
  });
});

describe('GitHubUserRepository.getUser', () => {
  it('maps the public profile from /users/:login', async () => {
    server.use(
      http.get(`${GITHUB_BASE_URL}/users/octocat`, () =>
        HttpResponse.json({
          id: 583231,
          login: 'octocat',
          name: 'The Octocat',
          email: null,
          avatar_url: 'https://github.com/octocat.png',
          bio: 'Mascote',
          public_repos: 8,
          followers: 9999,
          following: 9,
        }),
      ),
    );

    const user = await new GitHubUserRepository().getUser('octocat');

    expect(user).toEqual({
      id: 583231,
      login: 'octocat',
      name: 'The Octocat',
      email: null,
      avatarUrl: 'https://github.com/octocat.png',
      bio: 'Mascote',
      publicReposCount: 8,
      followers: 9999,
      following: 9,
    });
  });

  it('treats a missing email in the public payload as null', async () => {
    server.use(
      http.get(`${GITHUB_BASE_URL}/users/octocat`, () =>
        HttpResponse.json({
          id: 1,
          login: 'octocat',
          name: null,
          avatar_url: 'https://x/a.png',
          bio: null,
          public_repos: 0,
          followers: 0,
          following: 0,
        }),
      ),
    );

    const user = await new GitHubUserRepository().getUser('octocat');

    expect(user.email).toBeNull();
  });

  it('maps 404 to NotFoundError', async () => {
    server.use(
      http.get(`${GITHUB_BASE_URL}/users/fantasma`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
    );

    await expect(new GitHubUserRepository().getUser('fantasma')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

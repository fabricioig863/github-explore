import { http, HttpResponse } from 'msw';

import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';
import { GitHubIssueRepository } from 'src/infra/repositories/GitHubIssueRepository';

import { GITHUB_BASE_URL, server } from '../../test-utils/msw/server';

function makeIssueDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 5001,
    number: 12,
    title: 'Bug X',
    state: 'open' as const,
    user: {
      login: 'octocat',
      avatar_url: 'https://github.com/octocat.png',
    },
    labels: [{ id: 1, name: 'bug', color: 'd73a4a' }],
    comments: 3,
    created_at: '2026-02-10T09:00:00Z',
    html_url: 'https://github.com/foo/bar/issues/12',
    ...overrides,
  };
}

describe('GitHubIssueRepository (HTTP integration via msw)', () => {
  describe('list', () => {
    it('queries /search/issues with the repo, type and state qualifiers, sorted by created desc', async () => {
      let capturedUrl: URL | undefined;
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ total_count: 0, items: [] });
        }),
      );

      await new GitHubIssueRepository().list({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
        page: 1,
        perPage: 20,
      });

      expect(capturedUrl?.pathname).toBe('/search/issues');
      expect(capturedUrl?.searchParams.get('q')).toBe('repo:foo/bar type:issue state:open');
      expect(capturedUrl?.searchParams.get('sort')).toBe('created');
      expect(capturedUrl?.searchParams.get('order')).toBe('desc');
      expect(capturedUrl?.searchParams.get('page')).toBe('1');
      expect(capturedUrl?.searchParams.get('per_page')).toBe('20');
    });

    it('forwards state=closed when requested', async () => {
      let capturedQ: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, ({ request }) => {
          capturedQ = new URL(request.url).searchParams.get('q');
          return HttpResponse.json({ total_count: 0, items: [] });
        }),
      );

      await new GitHubIssueRepository().list({
        owner: 'foo',
        repo: 'bar',
        state: 'closed',
        page: 1,
        perPage: 20,
      });

      expect(capturedQ).toBe('repo:foo/bar type:issue state:closed');
    });

    it('returns a PaginatedResult with mapped issues and hasNextPage', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () =>
          HttpResponse.json({
            total_count: 50,
            items: [
              makeIssueDto({ id: 1, title: 'First' }),
              makeIssueDto({ id: 2, title: 'Second' }),
            ],
          }),
        ),
      );

      const result = await new GitHubIssueRepository().list({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
        page: 1,
        perPage: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.title).toBe('First');
      expect(result.items[0]?.createdAt).toBeInstanceOf(Date);
      expect(result.items[0]?.author.login).toBe('octocat');
      expect(result.items[0]).not.toHaveProperty('created_at');
      expect(result.items[0]).not.toHaveProperty('html_url');
      expect(result.totalCount).toBe(50);
      expect(result.hasNextPage).toBe(true);
    });

    it.each([
      ['página final preenche o total exato → false', 5, 20, 100, false],
      ['ainda há mais itens → true', 2, 20, 100, true],
    ])('calcula hasNextPage: %s', async (_label, page, perPage, total, expected) => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () =>
          HttpResponse.json({ total_count: total, items: [] }),
        ),
      );

      const result = await new GitHubIssueRepository().list({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
        page,
        perPage,
      });

      expect(result.hasNextPage).toBe(expected);
    });

    it('raises RateLimitError on 403 with rate-limit headers', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () =>
          HttpResponse.json({}, { status: 403, headers: { 'x-ratelimit-remaining': '0' } }),
        ),
      );

      await expect(
        new GitHubIssueRepository().list({
          owner: 'foo',
          repo: 'bar',
          state: 'open',
          page: 1,
          perPage: 20,
        }),
      ).rejects.toBeInstanceOf(RateLimitError);
    });

    it('raises NotFoundError on 404 with the issues resource context', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () => HttpResponse.json({}, { status: 404 })),
      );

      const promise = new GitHubIssueRepository().list({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
        page: 1,
        perPage: 20,
      });
      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await promise.catch((err: NotFoundError) => {
        expect(err.message).toContain('Issues de foo/bar');
      });
    });

    it('raises NetworkError on a network failure', async () => {
      server.use(http.get(`${GITHUB_BASE_URL}/search/issues`, () => HttpResponse.error()));

      await expect(
        new GitHubIssueRepository().list({
          owner: 'foo',
          repo: 'bar',
          state: 'open',
          page: 1,
          perPage: 20,
        }),
      ).rejects.toBeInstanceOf(NetworkError);
    });
  });

  describe('count', () => {
    it('sends per_page=1 with state:open and returns the total', async () => {
      let capturedUrl: URL | undefined;
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ total_count: 142, items: [] });
        }),
      );

      const count = await new GitHubIssueRepository().count({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
      });

      expect(capturedUrl?.searchParams.get('q')).toBe('repo:foo/bar type:issue state:open');
      expect(capturedUrl?.searchParams.get('per_page')).toBe('1');
      expect(count).toBe(142);
    });

    it('forwards state:closed in the query', async () => {
      let capturedQ: string | null = null;
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, ({ request }) => {
          capturedQ = new URL(request.url).searchParams.get('q');
          return HttpResponse.json({ total_count: 8900, items: [] });
        }),
      );

      const count = await new GitHubIssueRepository().count({
        owner: 'foo',
        repo: 'bar',
        state: 'closed',
      });

      expect(capturedQ).toBe('repo:foo/bar type:issue state:closed');
      expect(count).toBe(8900);
    });

    it('raises RateLimitError on 429', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () => HttpResponse.json({}, { status: 429 })),
      );

      await expect(
        new GitHubIssueRepository().count({ owner: 'foo', repo: 'bar', state: 'open' }),
      ).rejects.toBeInstanceOf(RateLimitError);
    });

    it('raises NotFoundError on 404 with the issue-count resource context', async () => {
      server.use(
        http.get(`${GITHUB_BASE_URL}/search/issues`, () => HttpResponse.json({}, { status: 404 })),
      );

      const promise = new GitHubIssueRepository().count({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
      });
      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await promise.catch((err: NotFoundError) => {
        expect(err.message).toContain('Contagem de issues de foo/bar');
      });
    });
  });
});

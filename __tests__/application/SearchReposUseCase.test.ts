import { SearchReposUseCase } from '@/application/use-cases/SearchReposUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeRepoRepository } from '../test-utils/fakes/FakeRepoRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';
import { FakeAnalytics } from '../test-utils/fakes/FakeAnalytics';

describe('SearchReposUseCase', () => {
  describe('sanitization', () => {
    it.each([
      ['leading whitespace', ' react', 'react'],
      ['trailing whitespace', 'react ', 'react'],
      ['both sides', '   react   ', 'react'],
    ])('trim de query: %s', async (_label, input, expected) => {
      const repo = new FakeRepoRepository();
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await useCase.execute({ query: input, page: 1 });

      expect(repo.search).toHaveBeenCalledWith({ query: expected, page: 1, perPage: 20 });
    });
  });

  describe('validation', () => {
    it('rejects a whitespace-only query without calling the repository', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute({ query: '   ', page: 1 })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.search).not.toHaveBeenCalled();
    });

    it('rejects a single-character query without calling the repository', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute({ query: ' a ', page: 1 })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.search).not.toHaveBeenCalled();
    });
  });

  describe('business rule defaults', () => {
    it('defaults perPage to 20 when absent', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await useCase.execute({ query: 'react', page: 2 });

      expect(repo.search).toHaveBeenCalledWith({ query: 'react', page: 2, perPage: 20 });
    });

    it('forwards a custom perPage when provided', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await useCase.execute({ query: 'react', page: 1, perPage: 50 });

      expect(repo.search).toHaveBeenCalledWith({ query: 'react', page: 1, perPage: 50 });
    });
  });

  describe('return pass-through', () => {
    it('returns the PaginatedResult untouched, preserving the reference', async () => {
      const expected = {
        items: [makeRepository({ id: 1 }), makeRepository({ id: 2 })],
        totalCount: 2,
        hasNextPage: false,
      };
      const repo = new FakeRepoRepository({ search: expected });
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      const result = await useCase.execute({ query: 'react', page: 1 });

      expect(result).toBe(expected);
    });
  });

  describe('typed error propagation', () => {
    it.each([
      ['NetworkError', new NetworkError()],
      ['RateLimitError', new RateLimitError()],
      ['NotFoundError', new NotFoundError('Repositório')],
      ['UnexpectedError', new UnexpectedError()],
    ])('propaga %s sem reembrulhar', async (_label, error) => {
      const repo = new FakeRepoRepository();
      repo.search.mockRejectedValueOnce(error);
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute({ query: 'react', page: 1 })).rejects.toBe(error);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns pushedAt as a Date, not a raw ISO string', async () => {
      const expected = {
        items: [makeRepository({ pushedAt: new Date('2026-01-15T10:00:00Z') })],
        totalCount: 1,
        hasNextPage: false,
      };
      const repo = new FakeRepoRepository({ search: expected });
      const useCase = new SearchReposUseCase(repo, new FakeAnalytics());

      const result = await useCase.execute({ query: 'react', page: 1 });

      expect(result.items[0]?.pushedAt).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('total_count');
      expect(result.items[0]).not.toHaveProperty('pushed_at');
    });
  });
});

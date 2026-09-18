import { ListIssuesUseCase } from '@/application/use-cases/ListIssuesUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';

import { FakeIssueRepository } from '../test-utils/fakes/FakeIssueRepository';
import { makeIssue } from '../test-utils/fixtures/issue.fixture';

describe('ListIssuesUseCase', () => {
  describe('sanitization', () => {
    it('trims owner and repo before delegating', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: '  foo  ', repo: '  bar  ', page: 1 });

      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ owner: 'foo', repo: 'bar' }),
      );
    });
  });

  describe('validation', () => {
    it('rejects a whitespace-only owner without calling the repository', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await expect(useCase.execute({ owner: ' ', repo: 'bar', page: 1 })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.list).not.toHaveBeenCalled();
    });

    it('rejects an empty repo without calling the repository', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await expect(useCase.execute({ owner: 'foo', repo: '', page: 1 })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.list).not.toHaveBeenCalled();
    });
  });

  describe('business rule defaults', () => {
    it("state padrão = 'open' quando ausente", async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar', page: 1 });

      expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ state: 'open' }));
    });

    it("encaminha state='closed' quando fornecido", async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar', state: 'closed', page: 1 });

      expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }));
    });

    it('defaults perPage to 20 when absent', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar', page: 1 });

      expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ perPage: 20 }));
    });

    it('encaminha perPage customizado', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar', page: 1, perPage: 50 });

      expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ perPage: 50 }));
    });

    it('applies trimming and defaults together in a single call', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new ListIssuesUseCase(repo);

      await useCase.execute({ owner: '  foo  ', repo: '  bar  ', page: 1 });

      expect(repo.list).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        state: 'open',
        page: 1,
        perPage: 20,
      });
    });
  });

  describe('return pass-through', () => {
    it('returns the PaginatedResult untouched', async () => {
      const expected = { items: [makeIssue()], totalCount: 1, hasNextPage: false };
      const repo = new FakeIssueRepository({ list: expected });
      const useCase = new ListIssuesUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar', page: 1 });
      expect(result).toBe(expected);
    });
  });

  describe('typed error propagation', () => {
    it.each([
      ['RateLimitError', new RateLimitError()],
      ['NetworkError', new NetworkError()],
      ['NotFoundError', new NotFoundError('Issues')],
    ])('propaga %s sem reembrulhar', async (_label, error) => {
      const repo = new FakeIssueRepository();
      repo.list.mockRejectedValueOnce(error);
      const useCase = new ListIssuesUseCase(repo);

      await expect(useCase.execute({ owner: 'foo', repo: 'bar', page: 1 })).rejects.toBe(error);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns createdAt as a Date, not a raw ISO string', async () => {
      const expected = {
        items: [makeIssue({ createdAt: new Date('2026-02-10T09:00:00Z') })],
        totalCount: 1,
        hasNextPage: false,
      };
      const repo = new FakeIssueRepository({ list: expected });
      const useCase = new ListIssuesUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar', page: 1 });

      expect(result.items[0]?.createdAt).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('total_count');
      expect(result.items[0]).not.toHaveProperty('created_at');
      expect(result.items[0]).not.toHaveProperty('html_url');
    });
  });
});

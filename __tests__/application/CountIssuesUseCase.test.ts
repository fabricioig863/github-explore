import { CountIssuesUseCase } from '@/application/use-cases/CountIssuesUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NetworkError } from '@/domain/errors/NetworkError';
import { RateLimitError } from '@/domain/errors/RateLimitError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeIssueRepository } from '../test-utils/fakes/FakeIssueRepository';

describe('CountIssuesUseCase', () => {
  describe('sanitization', () => {
    it('trims owner and repo before delegating', async () => {
      const repo = new FakeIssueRepository({ count: 42 });
      const useCase = new CountIssuesUseCase(repo);

      const count = await useCase.execute({ owner: '  foo  ', repo: '  bar  ' });

      expect(repo.count).toHaveBeenCalledWith({ owner: 'foo', repo: 'bar', state: 'open' });
      expect(count).toBe(42);
    });
  });

  describe('state', () => {
    it('uses state "open" by default', async () => {
      const repo = new FakeIssueRepository({ count: 1 });
      const useCase = new CountIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar' });

      expect(repo.count).toHaveBeenCalledWith({ owner: 'foo', repo: 'bar', state: 'open' });
    });

    it('forwards state "closed" when provided', async () => {
      const repo = new FakeIssueRepository({ count: 1 });
      const useCase = new CountIssuesUseCase(repo);

      await useCase.execute({ owner: 'foo', repo: 'bar', state: 'closed' });

      expect(repo.count).toHaveBeenCalledWith({ owner: 'foo', repo: 'bar', state: 'closed' });
    });
  });

  describe('validation', () => {
    it('rejects an empty owner without calling the repository', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new CountIssuesUseCase(repo);

      await expect(useCase.execute({ owner: '', repo: 'bar' })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.count).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only repo without calling the repository', async () => {
      const repo = new FakeIssueRepository();
      const useCase = new CountIssuesUseCase(repo);

      await expect(useCase.execute({ owner: 'foo', repo: ' ' })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.count).not.toHaveBeenCalled();
    });
  });

  describe('return pass-through', () => {
    it.each([
      ['zero', 0],
      ['valor pequeno', 7],
      ['valor grande', 99_999],
    ])('devolve o number do repo sem mutação: %s', async (_label, value) => {
      const repo = new FakeIssueRepository({ count: value });
      const useCase = new CountIssuesUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar' });

      expect(result).toBe(value);
    });
  });

  describe('typed error propagation', () => {
    it.each([
      ['UnexpectedError', new UnexpectedError()],
      ['RateLimitError', new RateLimitError()],
      ['NetworkError', new NetworkError()],
    ])('propaga %s sem reembrulhar', async (_label, error) => {
      const repo = new FakeIssueRepository();
      repo.count.mockRejectedValueOnce(error);
      const useCase = new CountIssuesUseCase(repo);

      await expect(useCase.execute({ owner: 'foo', repo: 'bar' })).rejects.toBe(error);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns a plain number, not the {total_count} DTO', async () => {
      const repo = new FakeIssueRepository({ count: 73 });
      const useCase = new CountIssuesUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar' });

      expect(typeof result).toBe('number');
      expect(result).not.toEqual(expect.objectContaining({ total_count: expect.anything() }));
    });
  });
});

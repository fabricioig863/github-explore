import { GetRepoDetailsUseCase } from '@/application/use-cases/GetRepoDetailsUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';

import { FakeRepoRepository } from '../test-utils/fakes/FakeRepoRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';

describe('GetRepoDetailsUseCase', () => {
  describe('sanitization', () => {
    it('trims owner and repo before delegating', async () => {
      const repo = new FakeRepoRepository({ getDetails: makeRepository() });
      const useCase = new GetRepoDetailsUseCase(repo);

      await useCase.execute({ owner: '  facebook  ', repo: '  react-native  ' });

      expect(repo.getDetails).toHaveBeenCalledWith('facebook', 'react-native');
    });

    it.each([
      ['leading owner ws', ' foo', 'bar'],
      ['trailing repo ws', 'foo', 'bar '],
    ])('trim parcial: %s', async (_label, owner, r) => {
      const repo = new FakeRepoRepository({ getDetails: makeRepository() });
      const useCase = new GetRepoDetailsUseCase(repo);

      await useCase.execute({ owner, repo: r });

      expect(repo.getDetails).toHaveBeenCalledWith('foo', 'bar');
    });
  });

  describe('validation', () => {
    it('rejects a whitespace-only owner without calling the repository', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new GetRepoDetailsUseCase(repo);

      await expect(useCase.execute({ owner: '   ', repo: 'react-native' })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.getDetails).not.toHaveBeenCalled();
    });

    it('rejects an empty repo without calling the repository', async () => {
      const repo = new FakeRepoRepository();
      const useCase = new GetRepoDetailsUseCase(repo);

      await expect(useCase.execute({ owner: 'facebook', repo: '' })).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.getDetails).not.toHaveBeenCalled();
    });
  });

  describe('return pass-through', () => {
    it('returns the repository result untouched, preserving the reference', async () => {
      const expected = makeRepository({ fullName: 'foo/bar' });
      const repo = new FakeRepoRepository({ getDetails: expected });
      const useCase = new GetRepoDetailsUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar' });
      expect(result).toBe(expected);
    });
  });

  describe('typed error propagation', () => {
    it.each([
      ['NotFoundError', new NotFoundError('Repositório')],
      ['NetworkError', new NetworkError()],
      ['RateLimitError', new RateLimitError()],
    ])('propaga %s sem reembrulhar', async (_label, error) => {
      const repo = new FakeRepoRepository();
      repo.getDetails.mockRejectedValueOnce(error);
      const useCase = new GetRepoDetailsUseCase(repo);

      await expect(useCase.execute({ owner: 'foo', repo: 'bar' })).rejects.toBe(error);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns pushedAt as a Date, not a raw ISO string', async () => {
      const expected = makeRepository({ pushedAt: new Date('2026-01-15T10:00:00Z') });
      const repo = new FakeRepoRepository({ getDetails: expected });
      const useCase = new GetRepoDetailsUseCase(repo);

      const result = await useCase.execute({ owner: 'foo', repo: 'bar' });

      expect(result.pushedAt).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('pushed_at');
      expect(result).not.toHaveProperty('full_name');
    });
  });
});

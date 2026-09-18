import { IsRepoSavedUseCase } from '@/application/use-cases/IsRepoSavedUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeSavedReposRepository } from '../test-utils/fakes/FakeSavedReposRepository';

describe('IsRepoSavedUseCase', () => {
  describe('sanitization', () => {
    it('trims fullName before delegating', async () => {
      const repo = new FakeSavedReposRepository({ isSaved: true });
      const useCase = new IsRepoSavedUseCase(repo);

      await useCase.execute('  foo/bar  ');

      expect(repo.isSaved).toHaveBeenCalledWith('foo/bar');
    });
  });

  describe('validation', () => {
    it('rejects an empty fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new IsRepoSavedUseCase(repo);

      await expect(useCase.execute('')).rejects.toBeInstanceOf(InvalidQueryError);
      expect(repo.isSaved).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new IsRepoSavedUseCase(repo);

      await expect(useCase.execute('   ')).rejects.toBeInstanceOf(InvalidQueryError);
      expect(repo.isSaved).not.toHaveBeenCalled();
    });
  });

  describe('return pass-through', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('devolve o boolean do repo: %s', async (_label, value) => {
      const repo = new FakeSavedReposRepository({ isSaved: value });
      const useCase = new IsRepoSavedUseCase(repo);

      const result = await useCase.execute('foo/bar');

      expect(result).toBe(value);
    });
  });

  describe('typed error propagation', () => {
    it('propagates UnexpectedError without re-wrapping it', async () => {
      const repo = new FakeSavedReposRepository();
      const err = new UnexpectedError();
      repo.isSaved.mockRejectedValueOnce(err);
      const useCase = new IsRepoSavedUseCase(repo);

      await expect(useCase.execute('foo/bar')).rejects.toBe(err);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns a plain boolean, not an object', async () => {
      const repo = new FakeSavedReposRepository({ isSaved: true });
      const useCase = new IsRepoSavedUseCase(repo);

      const result = await useCase.execute('foo/bar');

      expect(typeof result).toBe('boolean');
    });
  });
});

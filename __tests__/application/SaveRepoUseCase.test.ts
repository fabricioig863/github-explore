import { SaveRepoUseCase } from '@/application/use-cases/SaveRepoUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeSavedReposRepository } from '../test-utils/fakes/FakeSavedReposRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';
import { makeSavedRepo } from '../test-utils/fixtures/savedRepo.fixture';
import { FakeAnalytics } from '../test-utils/fakes/FakeAnalytics';

describe('SaveRepoUseCase', () => {
  describe('validation', () => {
    it('rejects a whitespace-only fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new SaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute(makeRepository({ fullName: '   ' }))).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rejects an empty fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new SaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute(makeRepository({ fullName: '' }))).rejects.toBeInstanceOf(
        InvalidQueryError,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('return pass-through', () => {
    it('forwards the repository and returns the saved entry, preserving the reference', async () => {
      const expected = makeSavedRepo();
      const repo = new FakeSavedReposRepository({ save: expected });
      const useCase = new SaveRepoUseCase(repo, new FakeAnalytics());

      const input = makeRepository({ fullName: 'facebook/react-native' });
      const result = await useCase.execute(input);

      expect(repo.save).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(expected);
    });
  });

  describe('typed error propagation', () => {
    it('propagates UnexpectedError without re-wrapping it', async () => {
      const repo = new FakeSavedReposRepository();
      const err = new UnexpectedError();
      repo.save.mockRejectedValueOnce(err);
      const useCase = new SaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute(makeRepository())).rejects.toBe(err);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns savedAt as a Date, not a string', async () => {
      const expected = makeSavedRepo({ savedAt: new Date('2026-05-17T10:00:00Z') });
      const repo = new FakeSavedReposRepository({ save: expected });
      const useCase = new SaveRepoUseCase(repo, new FakeAnalytics());

      const result = await useCase.execute(makeRepository());

      expect(result.savedAt).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('saved_at');
      expect(result).not.toHaveProperty('full_name');
    });
  });
});

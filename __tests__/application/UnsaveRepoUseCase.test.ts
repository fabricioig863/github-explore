import { UnsaveRepoUseCase } from '@/application/use-cases/UnsaveRepoUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeSavedReposRepository } from '../test-utils/fakes/FakeSavedReposRepository';
import { FakeAnalytics } from '../test-utils/fakes/FakeAnalytics';

describe('UnsaveRepoUseCase', () => {
  describe('sanitization', () => {
    it('trims fullName before delegating', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new UnsaveRepoUseCase(repo, new FakeAnalytics());

      await useCase.execute('  facebook/react-native  ');

      expect(repo.unsave).toHaveBeenCalledWith('facebook/react-native');
    });
  });

  describe('validation', () => {
    it('rejects a whitespace-only fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new UnsaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute('   ')).rejects.toBeInstanceOf(InvalidQueryError);
      expect(repo.unsave).not.toHaveBeenCalled();
    });

    it('rejects an empty fullName without calling the repository', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new UnsaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute('')).rejects.toBeInstanceOf(InvalidQueryError);
      expect(repo.unsave).not.toHaveBeenCalled();
    });
  });

  describe('return pass-through', () => {
    it('resolves to void and calls the repository exactly once', async () => {
      const repo = new FakeSavedReposRepository();
      const useCase = new UnsaveRepoUseCase(repo, new FakeAnalytics());

      const result = await useCase.execute('foo/bar');

      expect(result).toBeUndefined();
      expect(repo.unsave).toHaveBeenCalledTimes(1);
    });
  });

  describe('typed error propagation', () => {
    it('propagates UnexpectedError without re-wrapping it', async () => {
      const repo = new FakeSavedReposRepository();
      const err = new UnexpectedError();
      repo.unsave.mockRejectedValueOnce(err);
      const useCase = new UnsaveRepoUseCase(repo, new FakeAnalytics());

      await expect(useCase.execute('foo/bar')).rejects.toBe(err);
    });
  });
});

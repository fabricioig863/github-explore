import { ListSavedReposUseCase } from '@/application/use-cases/ListSavedReposUseCase';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeSavedReposRepository } from '../test-utils/fakes/FakeSavedReposRepository';
import { makeSavedRepo } from '../test-utils/fixtures/savedRepo.fixture';

describe('ListSavedReposUseCase', () => {
  describe('return pass-through', () => {
    it('returns the array untouched, preserving the reference', async () => {
      const items = [
        makeSavedRepo({ id: 1 }),
        makeSavedRepo({ id: 2, fullName: 'a/b', name: 'b' }),
      ];
      const repo = new FakeSavedReposRepository({ list: items });
      const useCase = new ListSavedReposUseCase(repo);

      const result = await useCase.execute();

      expect(result).toBe(items);
      expect(repo.list).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when nothing is saved', async () => {
      const repo = new FakeSavedReposRepository({ list: [] });
      const useCase = new ListSavedReposUseCase(repo);

      expect(await useCase.execute()).toEqual([]);
    });
  });

  describe('typed error propagation', () => {
    it('propagates UnexpectedError without re-wrapping it', async () => {
      const repo = new FakeSavedReposRepository();
      const err = new UnexpectedError();
      repo.list.mockRejectedValueOnce(err);
      const useCase = new ListSavedReposUseCase(repo);

      await expect(useCase.execute()).rejects.toBe(err);
    });
  });

  describe('does not leak infrastructure types', () => {
    it('returns savedAt as a Date on every item', async () => {
      const items = [
        makeSavedRepo({ id: 1, savedAt: new Date('2026-05-17T10:00:00Z') }),
        makeSavedRepo({ id: 2, savedAt: new Date('2026-05-18T10:00:00Z') }),
      ];
      const repo = new FakeSavedReposRepository({ list: items });
      const useCase = new ListSavedReposUseCase(repo);

      const result = await useCase.execute();

      expect(result[0]?.savedAt).toBeInstanceOf(Date);
      expect(result[1]?.savedAt).toBeInstanceOf(Date);
      expect(result[0]).not.toHaveProperty('saved_at');
    });
  });
});

import { SaveRepoUseCase } from '@/application/use-cases/SaveRepoUseCase';
import { SearchReposUseCase } from '@/application/use-cases/SearchReposUseCase';
import { UnsaveRepoUseCase } from '@/application/use-cases/UnsaveRepoUseCase';

import { FakeAnalytics } from '../test-utils/fakes/FakeAnalytics';
import { FakeRepoRepository } from '../test-utils/fakes/FakeRepoRepository';
import { FakeSavedReposRepository } from '../test-utils/fakes/FakeSavedReposRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';
import { makeSavedRepo } from '../test-utils/fixtures/savedRepo.fixture';

describe('eventos de analytics emitidos pelos use cases', () => {
  describe('SaveRepoUseCase', () => {
    it('emite repo_saved com a coleção resolvida', async () => {
      const analytics = new FakeAnalytics();
      const repo = new FakeSavedReposRepository({
        save: makeSavedRepo({ fullName: 'facebook/react', name: 'react', topics: ['react'] }),
      });

      await new SaveRepoUseCase(repo, analytics).execute(
        makeRepository({ fullName: 'facebook/react' }),
      );

      expect(analytics.eventsNamed('repo_saved')).toEqual([
        { name: 'repo_saved', fullName: 'facebook/react', collection: 'web' },
      ]);
    });

    it('reporta collection null quando nada casa', async () => {
      const analytics = new FakeAnalytics();
      const repo = new FakeSavedReposRepository({
        save: makeSavedRepo({
          fullName: 'alguem/coisa',
          name: 'coisa',
          ownerLogin: 'alguem',
          language: 'Brainfuck',
        }),
      });

      await new SaveRepoUseCase(repo, analytics).execute(makeRepository());

      expect(analytics.eventsNamed('repo_saved')[0]?.collection).toBeNull();
    });

    it('não emite evento quando a validação falha', async () => {
      const analytics = new FakeAnalytics();
      const repo = new FakeSavedReposRepository();

      await expect(
        new SaveRepoUseCase(repo, analytics).execute(makeRepository({ fullName: '  ' })),
      ).rejects.toThrow();

      expect(analytics.track).not.toHaveBeenCalled();
    });
  });

  describe('UnsaveRepoUseCase', () => {
    it('emite repo_unsaved com o fullName normalizado', async () => {
      const analytics = new FakeAnalytics();

      await new UnsaveRepoUseCase(new FakeSavedReposRepository(), analytics).execute(
        '  facebook/react  ',
      );

      expect(analytics.eventsNamed('repo_unsaved')).toEqual([
        { name: 'repo_unsaved', fullName: 'facebook/react' },
      ]);
    });
  });

  describe('SearchReposUseCase', () => {
    it('emite repo_searched na primeira página, com a contagem', async () => {
      const analytics = new FakeAnalytics();
      const repo = new FakeRepoRepository({
        search: { items: [makeRepository()], totalCount: 42, hasNextPage: true },
      });

      await new SearchReposUseCase(repo, analytics).execute({ query: 'react', page: 1 });

      expect(analytics.eventsNamed('repo_searched')).toEqual([
        { name: 'repo_searched', query: 'react', resultCount: 42 },
      ]);
    });

    it('não emite nas páginas seguintes, para não contar a mesma busca várias vezes', async () => {
      const analytics = new FakeAnalytics();
      const repo = new FakeRepoRepository({
        search: { items: [makeRepository()], totalCount: 42, hasNextPage: true },
      });

      await new SearchReposUseCase(repo, analytics).execute({ query: 'react', page: 2 });

      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('não emite quando a query é inválida', async () => {
      const analytics = new FakeAnalytics();

      await expect(
        new SearchReposUseCase(new FakeRepoRepository(), analytics).execute({
          query: 'a',
          page: 1,
        }),
      ).rejects.toThrow();

      expect(analytics.track).not.toHaveBeenCalled();
    });
  });
});

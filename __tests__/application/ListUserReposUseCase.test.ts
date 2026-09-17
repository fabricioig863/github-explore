import { ListUserReposUseCase } from '@/application/use-cases/ListUserReposUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';

import { FakeUserRepository } from '../test-utils/fakes/FakeUserRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';

describe('ListUserReposUseCase', () => {
  it('trim do login e perPage default 20', async () => {
    const repo = new FakeUserRepository();
    const useCase = new ListUserReposUseCase(repo);

    await useCase.execute({ login: '  octocat  ', page: 1 });

    expect(repo.listUserRepos).toHaveBeenCalledWith({ login: 'octocat', page: 1, perPage: 20 });
  });

  it('encaminha perPage explícito', async () => {
    const repo = new FakeUserRepository();
    const useCase = new ListUserReposUseCase(repo);

    await useCase.execute({ login: 'octocat', page: 2, perPage: 30 });

    expect(repo.listUserRepos).toHaveBeenCalledWith({ login: 'octocat', page: 2, perPage: 30 });
  });

  it('rejeita login vazio com InvalidQueryError e não chama o repo', async () => {
    const repo = new FakeUserRepository();
    const useCase = new ListUserReposUseCase(repo);

    await expect(useCase.execute({ login: '   ', page: 1 })).rejects.toBeInstanceOf(
      InvalidQueryError,
    );
    expect(repo.listUserRepos).not.toHaveBeenCalled();
  });

  it('devolve o PaginatedResult do repo', async () => {
    const page = { items: [makeRepository({ id: 1 })], totalCount: 1, hasNextPage: false };
    const repo = new FakeUserRepository({ listUserRepos: page });
    const useCase = new ListUserReposUseCase(repo);

    expect(await useCase.execute({ login: 'octocat', page: 1 })).toBe(page);
  });
});

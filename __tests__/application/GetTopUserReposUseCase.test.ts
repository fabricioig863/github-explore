import { GetTopUserReposUseCase } from '@/application/use-cases/GetTopUserReposUseCase';
import { ListUserReposUseCase } from '@/application/use-cases/ListUserReposUseCase';

import { FakeUserRepository } from '../test-utils/fakes/FakeUserRepository';
import { makeRepository } from '../test-utils/fixtures/repository.fixture';

function makeUseCase(repo: FakeUserRepository) {
  return new GetTopUserReposUseCase(new ListUserReposUseCase(repo));
}

describe('GetTopUserReposUseCase', () => {
  it('fetches page 1 with perPage 30', async () => {
    const repo = new FakeUserRepository();
    await makeUseCase(repo).execute('octocat');

    expect(repo.listUserRepos).toHaveBeenCalledWith({ login: 'octocat', page: 1, perPage: 30 });
  });

  it('sorts by stars descending and slices at the limit (default 6)', async () => {
    const items = [
      makeRepository({ id: 1, name: 'a', stars: 10 }),
      makeRepository({ id: 2, name: 'b', stars: 500 }),
      makeRepository({ id: 3, name: 'c', stars: 100 }),
    ];
    const repo = new FakeUserRepository({ listUserRepos: { items, hasNextPage: false } });

    const top = await makeUseCase(repo).execute('octocat');

    expect(top.map((r) => r.name)).toEqual(['b', 'c', 'a']);
  });

  it('respeita o limite informado', async () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeRepository({ id: i, name: `r${i}`, stars: i }),
    );
    const repo = new FakeUserRepository({ listUserRepos: { items, hasNextPage: false } });

    const top = await makeUseCase(repo).execute('octocat', 3);

    expect(top).toHaveLength(3);
    expect(top[0]?.stars).toBe(9);
  });
});

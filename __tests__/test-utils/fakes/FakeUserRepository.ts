import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository, ListUserReposParams } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

export class FakeUserRepository implements IUserRepository {
  listUserRepos: jest.Mock<Promise<PaginatedResult<Repository>>, [ListUserReposParams]>;

  constructor(defaults?: { listUserRepos?: PaginatedResult<Repository> }) {
    this.listUserRepos = jest
      .fn()
      .mockResolvedValue(defaults?.listUserRepos ?? { items: [], hasNextPage: false });
  }
}

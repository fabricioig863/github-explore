import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository, ListUserReposParams } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

const DEFAULT_USER: GitHubUser = {
  id: 583231,
  login: 'octocat',
  name: 'The Octocat',
  email: null,
  avatarUrl: 'https://github.com/octocat.png',
  bio: null,
  publicReposCount: 8,
  followers: 9999,
  following: 9,
};

export class FakeUserRepository implements IUserRepository {
  getUser: jest.Mock<Promise<GitHubUser>, [string]>;
  listUserRepos: jest.Mock<Promise<PaginatedResult<Repository>>, [ListUserReposParams]>;

  constructor(defaults?: { getUser?: GitHubUser; listUserRepos?: PaginatedResult<Repository> }) {
    this.getUser = jest.fn().mockResolvedValue(defaults?.getUser ?? DEFAULT_USER);
    this.listUserRepos = jest
      .fn()
      .mockResolvedValue(defaults?.listUserRepos ?? { items: [], hasNextPage: false });
  }
}

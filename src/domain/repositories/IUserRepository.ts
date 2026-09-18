import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { Repository } from '@/domain/entities/Repository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

export interface ListUserReposParams {
  login: string;
  page: number;
  perPage: number;
}

export interface IUserRepository {
  getUser(login: string): Promise<GitHubUser>;
  listUserRepos(params: ListUserReposParams): Promise<PaginatedResult<Repository>>;
}

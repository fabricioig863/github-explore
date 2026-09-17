import type { Repository } from '@/domain/entities/Repository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

export interface ListUserReposParams {
  login: string;
  page: number;
  perPage: number;
}

export interface IUserRepository {
  listUserRepos(params: ListUserReposParams): Promise<PaginatedResult<Repository>>;
}

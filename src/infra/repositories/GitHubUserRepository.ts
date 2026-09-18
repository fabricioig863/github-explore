import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository, ListUserReposParams } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';
import type { GithubUserDto } from 'src/infra/http/dtos/UserDtos';
import type { UserReposResponseDto } from 'src/infra/http/dtos/UserReposDto';
import { mapHttpError } from 'src/infra/http/errorMapper';
import { httpClient } from 'src/infra/http/httpClient';
import { mapRepository } from 'src/infra/http/mappers/repositoryMapper';
import { mapGitHubUser } from 'src/infra/http/mappers/userMapper';

export class GitHubUserRepository implements IUserRepository {
  async getUser(login: string): Promise<GitHubUser> {
    try {
      const response = await httpClient.get<GithubUserDto>(`/users/${login}`);
      return mapGitHubUser(response.data);
    } catch (err) {
      mapHttpError(err, `Perfil de ${login}`);
    }
  }

  async listUserRepos({
    login,
    page,
    perPage,
  }: ListUserReposParams): Promise<PaginatedResult<Repository>> {
    try {
      const response = await httpClient.get<UserReposResponseDto>(`/users/${login}/repos`, {
        params: { sort: 'updated', page, per_page: perPage },
      });

      const items = response.data.map(mapRepository);

      return { items, hasNextPage: items.length === perPage };
    } catch (err) {
      mapHttpError(err, `Repositórios de ${login}`);
    }
  }
}

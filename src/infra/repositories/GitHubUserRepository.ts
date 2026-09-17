import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository, ListUserReposParams } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';
import type { UserReposResponseDto } from 'src/infra/http/dtos/UserReposDto';
import { mapHttpError } from 'src/infra/http/errorMapper';
import { httpClient } from 'src/infra/http/httpClient';
import { mapRepository } from 'src/infra/http/mappers/repositoryMapper';

export class GitHubUserRepository implements IUserRepository {
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
      // O endpoint não devolve total_count; inferimos próxima página pelo tamanho.
      return { items, hasNextPage: items.length === perPage };
    } catch (err) {
      mapHttpError(err, `Repositórios de ${login}`);
    }
  }
}

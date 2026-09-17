import type { ListUserReposUseCase } from '@/application/use-cases/ListUserReposUseCase';
import type { Repository } from '@/domain/entities/Repository';

const DEFAULT_LIMIT = 6;
const FETCH_PER_PAGE = 30;

export class GetTopUserReposUseCase {
  constructor(private readonly listUserReposUseCase: ListUserReposUseCase) {}

  // GitHub REST não expõe "pinned"; aproximamos pelos repos com mais estrelas.
  async execute(login: string, limit = DEFAULT_LIMIT): Promise<Repository[]> {
    const { items } = await this.listUserReposUseCase.execute({
      login,
      page: 1,
      perPage: FETCH_PER_PAGE,
    });

    return [...items].sort((a, b) => b.stars - a.stars).slice(0, limit);
  }
}

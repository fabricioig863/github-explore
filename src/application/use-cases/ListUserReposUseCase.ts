import { assertNonEmpty } from '@/application/validation/assertInput';
import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

export interface ListUserReposInput {
  login: string;
  page: number;
  perPage?: number;
}

export class ListUserReposUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUserReposInput): Promise<PaginatedResult<Repository>> {
    const login = assertNonEmpty(input.login, 'Login do usuário é obrigatório.');
    const perPage = input.perPage ?? 20;

    return this.userRepository.listUserRepos({ login, page: input.page, perPage });
  }
}

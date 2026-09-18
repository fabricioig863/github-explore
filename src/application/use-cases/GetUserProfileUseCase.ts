import { assertNonEmpty } from '@/application/validation/assertInput';
import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(login: string): Promise<GitHubUser> {
    assertNonEmpty(login, 'Informe um usuário do GitHub.');
    return this.userRepository.getUser(login.trim());
  }
}

import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}

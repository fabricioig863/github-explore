import type { AuthSession, IAuthRepository } from '@/domain/repositories/IAuthRepository';

export class GetCurrentSessionUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<AuthSession | null> {
    return this.authRepository.getCurrentSession();
  }
}

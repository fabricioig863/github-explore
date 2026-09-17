import { assertNonEmpty } from '@/application/validation/assertInput';
import type { AuthSession, IAuthRepository } from '@/domain/repositories/IAuthRepository';

export class SignInWithGithubUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(code: string): Promise<AuthSession> {
    const trimmed = assertNonEmpty(code, 'Código de autorização ausente.');
    return this.authRepository.signIn(trimmed);
  }
}

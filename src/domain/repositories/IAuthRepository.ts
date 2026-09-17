import type { AuthenticatedUser } from '@/domain/entities/AuthenticatedUser';

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
}

export interface IAuthRepository {
  /** Troca o authorization code por um token (via proxy), hidrata o usuário e persiste a sessão. */
  signIn(code: string): Promise<AuthSession>;
  /** Limpa o token/usuário do storage seguro. */
  signOut(): Promise<void>;
  /** Hidrata a sessão do storage; valida o token contra a API. Devolve null se ausente/expirado. */
  getCurrentSession(): Promise<AuthSession | null>;
}

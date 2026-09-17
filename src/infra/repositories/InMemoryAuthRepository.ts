import type { AuthenticatedUser } from '@/domain/entities/AuthenticatedUser';
import type { AuthSession, IAuthRepository } from '@/domain/repositories/IAuthRepository';

const FIXTURE_USER: AuthenticatedUser = {
  id: 583231,
  login: 'octocat',
  name: 'The Octocat',
  email: 'octocat@github.com',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  bio: 'Mascote do GitHub. Sessão fictícia para desenvolvimento.',
  publicReposCount: 8,
  followers: 9999,
  following: 9,
};

export class InMemoryAuthRepository implements IAuthRepository {
  private session: AuthSession | null;

  constructor(initial: AuthSession | null = null) {
    this.session = initial;
  }

  async signIn(_code: string): Promise<AuthSession> {
    this.session = { token: 'mock-access-token', user: FIXTURE_USER };
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    return this.session;
  }
}

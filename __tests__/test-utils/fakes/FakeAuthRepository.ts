import type { AuthSession, IAuthRepository } from '@/domain/repositories/IAuthRepository';

const DEFAULT_SESSION: AuthSession = {
  token: 'fake-token',
  user: {
    id: 1,
    login: 'octocat',
    name: 'The Octocat',
    email: 'octocat@github.com',
    avatarUrl: 'https://example.com/a.png',
    bio: null,
    publicReposCount: 0,
    followers: 0,
    following: 0,
  },
};

export class FakeAuthRepository implements IAuthRepository {
  signIn: jest.Mock<Promise<AuthSession>, [string]>;
  signOut: jest.Mock<Promise<void>, []>;
  getCurrentSession: jest.Mock<Promise<AuthSession | null>, []>;

  constructor(defaults?: { signIn?: AuthSession; currentSession?: AuthSession | null }) {
    this.signIn = jest.fn().mockResolvedValue(defaults?.signIn ?? DEFAULT_SESSION);
    this.signOut = jest.fn().mockResolvedValue(undefined);
    this.getCurrentSession = jest.fn().mockResolvedValue(defaults?.currentSession ?? null);
  }
}

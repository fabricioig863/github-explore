import { GetCurrentSessionUseCase } from '@/application/use-cases/GetCurrentSessionUseCase';
import type { AuthSession } from '@/domain/repositories/IAuthRepository';

import { FakeAuthRepository } from '../test-utils/fakes/FakeAuthRepository';

describe('GetCurrentSessionUseCase', () => {
  it('devolve null quando não há sessão', async () => {
    const repo = new FakeAuthRepository({ currentSession: null });
    const useCase = new GetCurrentSessionUseCase(repo);

    expect(await useCase.execute()).toBeNull();
  });

  it('devolve a sessão hidratada pelo repo', async () => {
    const session: AuthSession = {
      token: 't',
      user: {
        id: 9,
        login: 'dev',
        name: null,
        email: null,
        avatarUrl: 'a',
        bio: null,
        publicReposCount: 0,
        followers: 0,
        following: 0,
      },
    };
    const repo = new FakeAuthRepository({ currentSession: session });
    const useCase = new GetCurrentSessionUseCase(repo);

    expect(await useCase.execute()).toBe(session);
  });
});

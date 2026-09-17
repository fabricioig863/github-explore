import { SignOutUseCase } from '@/application/use-cases/SignOutUseCase';

import { FakeAuthRepository } from '../test-utils/fakes/FakeAuthRepository';

describe('SignOutUseCase', () => {
  it('delega para authRepository.signOut', async () => {
    const repo = new FakeAuthRepository();
    const useCase = new SignOutUseCase(repo);

    await useCase.execute();

    expect(repo.signOut).toHaveBeenCalledTimes(1);
  });

  it('propaga erro do repo', async () => {
    const repo = new FakeAuthRepository();
    const err = new Error('storage falhou');
    repo.signOut.mockRejectedValueOnce(err);
    const useCase = new SignOutUseCase(repo);

    await expect(useCase.execute()).rejects.toBe(err);
  });
});

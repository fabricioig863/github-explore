import { GetUserProfileUseCase } from '@/application/use-cases/GetUserProfileUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';

import { FakeUserRepository } from '../test-utils/fakes/FakeUserRepository';

describe('GetUserProfileUseCase', () => {
  it('busca o perfil pelo login', async () => {
    const repo = new FakeUserRepository();

    const user = await new GetUserProfileUseCase(repo).execute('octocat');

    expect(repo.getUser).toHaveBeenCalledWith('octocat');
    expect(user.login).toBe('octocat');
  });

  it('remove espaços em volta do login antes de consultar', async () => {
    const repo = new FakeUserRepository();

    await new GetUserProfileUseCase(repo).execute('  octocat  ');

    expect(repo.getUser).toHaveBeenCalledWith('octocat');
  });

  it.each([
    ['', 'vazio'],
    ['   ', 'só espaços'],
  ])('rejeita login %p (%s) sem chamar o repositório', async (login) => {
    const repo = new FakeUserRepository();

    await expect(new GetUserProfileUseCase(repo).execute(login)).rejects.toBeInstanceOf(
      InvalidQueryError,
    );
    expect(repo.getUser).not.toHaveBeenCalled();
  });
});

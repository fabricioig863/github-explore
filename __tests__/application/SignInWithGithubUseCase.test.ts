import { SignInWithGithubUseCase } from '@/application/use-cases/SignInWithGithubUseCase';
import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';

import { FakeAuthRepository } from '../test-utils/fakes/FakeAuthRepository';

describe('SignInWithGithubUseCase', () => {
  describe('sanitização', () => {
    it('trim do code antes de delegar', async () => {
      const repo = new FakeAuthRepository();
      const useCase = new SignInWithGithubUseCase(repo);

      await useCase.execute('  abc123  ');

      expect(repo.signIn).toHaveBeenCalledWith('abc123');
    });
  });

  describe('validação', () => {
    it.each([
      ['vazio', ''],
      ['só whitespace', '   '],
    ])('rejeita code %s com InvalidQueryError e não chama o repo', async (_label, value) => {
      const repo = new FakeAuthRepository();
      const useCase = new SignInWithGithubUseCase(repo);

      await expect(useCase.execute(value)).rejects.toBeInstanceOf(InvalidQueryError);
      expect(repo.signIn).not.toHaveBeenCalled();
    });
  });

  describe('caminho feliz', () => {
    it('devolve a sessão retornada pelo repo', async () => {
      const repo = new FakeAuthRepository();
      const useCase = new SignInWithGithubUseCase(repo);

      const session = await useCase.execute('abc123');

      expect(session.token).toBe('fake-token');
      expect(session.user.login).toBe('octocat');
    });
  });

  describe('propagação de erros tipados', () => {
    it('propaga erro do repo sem reembrulhar', async () => {
      const repo = new FakeAuthRepository();
      const err = new UnexpectedError();
      repo.signIn.mockRejectedValueOnce(err);
      const useCase = new SignInWithGithubUseCase(repo);

      await expect(useCase.execute('abc123')).rejects.toBe(err);
    });
  });
});

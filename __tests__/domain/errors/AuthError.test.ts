import { AuthCanceledError, AuthDeniedError, AuthExpiredError } from '@/domain/errors/AuthError';
import { DomainError } from '@/domain/errors/DomainError';

describe('AuthError subclasses', () => {
  describe('AuthCanceledError', () => {
    it('usa mensagem padrão pt-BR e code literal', () => {
      const err = new AuthCanceledError();
      expect(err.code).toBe('AUTH_CANCELED');
      expect(err.name).toBe('AuthCanceledError');
      expect(err.message).toBe('Autenticação cancelada.');
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it('aceita mensagem custom', () => {
      expect(new AuthCanceledError('X').message).toBe('X');
    });
  });

  describe('AuthDeniedError', () => {
    it('usa mensagem padrão pt-BR e code literal', () => {
      const err = new AuthDeniedError();
      expect(err.code).toBe('AUTH_DENIED');
      expect(err.name).toBe('AuthDeniedError');
      expect(err.message).toBe('Acesso negado pelo GitHub.');
      expect(err).toBeInstanceOf(DomainError);
    });

    it('aceita mensagem custom', () => {
      expect(new AuthDeniedError('negado').message).toBe('negado');
    });
  });

  describe('AuthExpiredError', () => {
    it('usa mensagem padrão pt-BR e code literal', () => {
      const err = new AuthExpiredError();
      expect(err.code).toBe('AUTH_EXPIRED');
      expect(err.name).toBe('AuthExpiredError');
      expect(err.message).toBe('Sua sessão expirou. Entre novamente.');
      expect(err).toBeInstanceOf(DomainError);
    });

    it('aceita mensagem custom', () => {
      expect(new AuthExpiredError('expirou').message).toBe('expirou');
    });
  });
});

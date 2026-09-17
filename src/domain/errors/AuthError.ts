import { DomainError } from '@/domain/errors/DomainError';

/** Usuário fechou/cancelou o fluxo de autorização antes de concluir. */
export class AuthCanceledError extends DomainError {
  readonly code = 'AUTH_CANCELED' as const;

  constructor(message = 'Autenticação cancelada.') {
    super(message);
  }
}

/** Usuário recusou as permissões ou o provedor negou a autorização. */
export class AuthDeniedError extends DomainError {
  readonly code = 'AUTH_DENIED' as const;

  constructor(message = 'Acesso negado pelo GitHub.') {
    super(message);
  }
}

/** Sessão existente expirou ou foi revogada (token inválido). */
export class AuthExpiredError extends DomainError {
  readonly code = 'AUTH_EXPIRED' as const;

  constructor(message = 'Sua sessão expirou. Entre novamente.') {
    super(message);
  }
}

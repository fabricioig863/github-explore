import type { QueryClient } from '@tanstack/react-query';

import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NetworkError } from '@/domain/errors/NetworkError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';
import { UnexpectedError } from '@/domain/errors/UnexpectedError';
import { createQueryClient } from 'src/infra/query/queryClient';

import { FakeCrashReporter } from '../../test-utils/fakes/FakeAnalytics';

const queryClient = createQueryClient(new FakeCrashReporter());

function getRetryFn(client: QueryClient): (count: number, err: unknown) => boolean {
  const retry = client.getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') {
    throw new Error('queryClient.defaultOptions.queries.retry deve ser function');
  }
  return retry as (count: number, err: unknown) => boolean;
}

describe('queryClient (infra/query/queryClient)', () => {
  describe('default configuration', () => {
    it('staleTime = 5 minutos', () => {
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('gcTime = 30 segundos', () => {
      expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(30 * 1000);
    });

    it('refetchOnWindowFocus = false, which is meaningless on mobile and avoids background refetches', () => {
      expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('shouldRetry — retry policy per error type', () => {
    it('does not retry RateLimitError, since retrying does not clear a rate limit', () => {
      const retry = getRetryFn(queryClient);
      expect(retry(0, new RateLimitError())).toBe(false);
    });

    it('does not retry InvalidQueryError, since bad input only repeats the error', () => {
      const retry = getRetryFn(queryClient);
      expect(retry(0, new InvalidQueryError('curta'))).toBe(false);
    });

    it('does not retry NotFoundError, since the resource does not exist', () => {
      const retry = getRetryFn(queryClient);
      expect(retry(0, new NotFoundError('Repositório'))).toBe(false);
    });

    it('retries once at failureCount = 0 for untyped errors such as NetworkError', () => {
      const retry = getRetryFn(queryClient);
      expect(retry(0, new NetworkError())).toBe(true);
      expect(retry(0, new UnexpectedError())).toBe(true);
      expect(retry(0, new Error('qualquer'))).toBe(true);
    });

    it('does not retry after the first failure, capping at one retry', () => {
      const retry = getRetryFn(queryClient);
      expect(retry(1, new NetworkError())).toBe(false);
      expect(retry(2, new UnexpectedError())).toBe(false);
    });
  });
});

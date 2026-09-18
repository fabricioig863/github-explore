import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { InvalidQueryError } from '@/domain/errors/InvalidQueryError';
import { NotFoundError } from '@/domain/errors/NotFoundError';
import { RateLimitError } from '@/domain/errors/RateLimitError';
import type { ICrashReporter } from '@/domain/observability/ICrashReporter';

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_SECONDS = 30 * 1000;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof RateLimitError) return false;
  if (error instanceof InvalidQueryError) return false;
  if (error instanceof NotFoundError) return false;
  return failureCount < 1;
}

function isExpected(error: unknown): boolean {
  return (
    error instanceof RateLimitError ||
    error instanceof InvalidQueryError ||
    error instanceof NotFoundError
  );
}

export function createQueryClient(crashReporter: ICrashReporter): QueryClient {
  const report = (error: unknown, source: string) => {
    if (!(error instanceof Error) || isExpected(error)) return;
    crashReporter.recordError(error, { source });
  };

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        report(error, 'query');
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        report(error, 'mutation');
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        gcTime: THIRTY_SECONDS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}

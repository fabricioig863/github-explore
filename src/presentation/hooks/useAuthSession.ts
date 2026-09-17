import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { AuthSession } from '@/domain/repositories/IAuthRepository';
import { authQueries } from '@/presentation/query/collections/authQueries';
import { queryKeys } from '@/presentation/query/queryKeys';
import { sessionEvents } from 'src/infra/auth/sessionEvents';
import { container } from 'src/infra/di/bootstrap';

interface UseAuthSession {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

export function useAuthSession(): UseAuthSession {
  const queryClient = useQueryClient();
  const query = useQuery(authQueries.session());

  useEffect(() => {
    return sessionEvents.onSessionExpired(() => {
      void container.signOutUseCase.execute().finally(() => {
        queryClient.setQueryData(queryKeys.auth.session(), null);
      });
    });
  }, [queryClient]);

  return {
    session: query.data ?? null,
    isAuthenticated: query.data != null,
    isHydrating: query.isLoading,
  };
}

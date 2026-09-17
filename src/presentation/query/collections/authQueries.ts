import { queryOptions } from '@tanstack/react-query';

import type { AuthSession } from '@/domain/repositories/IAuthRepository';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

export const authQueries = {
  session: () =>
    queryOptions<AuthSession | null>({
      queryKey: queryKeys.auth.session(),
      queryFn: () => container.getCurrentSessionUseCase.execute(),
      // A sessão só muda via signIn/signOut (setQueryData/invalidate); nunca expira sozinha.
      staleTime: Infinity,
    }),
};

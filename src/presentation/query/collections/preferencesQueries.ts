import { queryOptions } from '@tanstack/react-query';

import type { UserPreferences } from '@/domain/entities/UserPreferences';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

export const preferencesQueries = {
  user: () =>
    queryOptions<UserPreferences>({
      queryKey: queryKeys.prefs.user(),
      queryFn: () => container.getUserPreferencesUseCase.execute(),
      staleTime: 0,
    }),
};

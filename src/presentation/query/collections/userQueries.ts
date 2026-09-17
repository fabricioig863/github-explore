import { queryOptions } from '@tanstack/react-query';

import type { Repository } from '@/domain/entities/Repository';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

const TEN_MINUTES_MS = 10 * 60 * 1000;

export const userQueries = {
  topRepos: (login: string) =>
    queryOptions<Repository[]>({
      queryKey: queryKeys.users.topRepos(login),
      queryFn: () => container.getTopUserReposUseCase.execute(login),
      enabled: login.length > 0,
      staleTime: TEN_MINUTES_MS,
    }),
};

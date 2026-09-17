import { queryOptions } from '@tanstack/react-query';

import { paginatedQueryOptions } from '@/presentation/query/factories';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

const PER_PAGE = 20;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

type IssueState = 'open' | 'closed';

export const issueQueries = {
  list: (owner: string, repo: string, state: IssueState = 'open') =>
    paginatedQueryOptions({
      queryKey: queryKeys.issues(owner, repo, state),
      enabled: owner.length > 0 && repo.length > 0,
      fetchPage: (page) =>
        container.listIssuesUseCase.execute({ owner, repo, state, page, perPage: PER_PAGE }),
    }),

  count: (owner: string, repo: string, state: IssueState = 'open') =>
    queryOptions({
      queryKey: queryKeys.issuesCount(owner, repo, state),
      queryFn: () => container.countIssuesUseCase.execute({ owner, repo, state }),
      enabled: owner.length > 0 && repo.length > 0,
      staleTime: FIVE_MINUTES_MS,
    }),
};

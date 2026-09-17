import type { Issue } from '@/domain/entities/Issue';
import type {
  CountIssuesParams,
  IIssueRepository,
  ListIssuesParams,
} from '@/domain/repositories/IIssueRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';

export class FakeIssueRepository implements IIssueRepository {
  list: jest.Mock<Promise<PaginatedResult<Issue>>, [ListIssuesParams]>;
  count: jest.Mock<Promise<number>, [CountIssuesParams]>;

  constructor(defaults?: {
    list?: PaginatedResult<Issue>;
    count?: number;
  }) {
    const defaultPage: PaginatedResult<Issue> = defaults?.list ?? {
      items: [],
      totalCount: 0,
      hasNextPage: false,
    };
    this.list = jest.fn().mockResolvedValue(defaultPage);
    this.count = jest.fn().mockResolvedValue(defaults?.count ?? 0);
  }
}

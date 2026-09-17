import { assertOwnerRepo } from '@/application/validation/assertInput';
import type { IIssueRepository } from '@/domain/repositories/IIssueRepository';

type IssueState = 'open' | 'closed';

export interface CountIssuesInput {
  owner: string;
  repo: string;
  state?: IssueState;
}

export class CountIssuesUseCase {
  constructor(private readonly issueRepository: IIssueRepository) {}

  async execute(input: CountIssuesInput): Promise<number> {
    const { owner, repo } = assertOwnerRepo(input.owner, input.repo);
    const state = input.state ?? 'open';

    return this.issueRepository.count({ owner, repo, state });
  }
}

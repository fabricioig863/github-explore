import type { GitHubUser } from '@/domain/entities/GitHubUser';
import type { Repository } from '@/domain/entities/Repository';
import type { IUserRepository, ListUserReposParams } from '@/domain/repositories/IUserRepository';
import type { PaginatedResult } from '@/domain/repositories/Pagination';
import { REPOS_FIXTURE } from 'src/infra/repositories/fixtures/repos.fixture';

const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return Math.floor(MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS));
}

export class InMemoryUserRepository implements IUserRepository {
  async getUser(login: string): Promise<GitHubUser> {
    await delay(randomLatency());

    return {
      id: 583231,
      login,
      name: 'The Octocat',
      email: null,
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      bio: 'Mascote do GitHub. Perfil fictício para desenvolvimento.',
      publicReposCount: REPOS_FIXTURE.length,
      followers: 9999,
      following: 9,
    };
  }

  async listUserRepos({
    page,
    perPage,
  }: ListUserReposParams): Promise<PaginatedResult<Repository>> {
    await delay(randomLatency());

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = REPOS_FIXTURE.slice(start, end);

    return {
      items,
      totalCount: REPOS_FIXTURE.length,
      hasNextPage: end < REPOS_FIXTURE.length,
    };
  }
}

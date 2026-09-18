import type { QueryKey } from '@tanstack/react-query';

export const queryKeys = {
  searchRepos: (query: string): QueryKey => ['searchRepos', query],
  repoDetails: (owner: string, repo: string): QueryKey => ['repoDetails', owner, repo],
  issues: (owner: string, repo: string, state: string): QueryKey => ['issues', owner, repo, state],
  issuesCount: (owner: string, repo: string, state: string): QueryKey => [
    'issues',
    'count',
    owner,
    repo,
    state,
  ],
  savedRepos: (): QueryKey => ['savedRepos'],
  isRepoSaved: (fullName: string): QueryKey => ['savedRepos', 'isSaved', fullName],
  accessToken: (): QueryKey => ['accessToken'],
  users: {
    profile: (login: string): QueryKey => ['users', login, 'profile'],
    topRepos: (login: string): QueryKey => ['users', login, 'topRepos'],
  },
  prefs: {
    user: (): QueryKey => ['prefs', 'user'],
  },
} as const;

import type { IIssueRepository } from '@/domain/repositories/IIssueRepository';
import type { IRepoRepository } from '@/domain/repositories/IRepoRepository';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { AsyncStorageSavedReposRepository } from 'src/infra/repositories/AsyncStorageSavedReposRepository';
import { AsyncStorageUserPreferencesRepository } from 'src/infra/repositories/AsyncStorageUserPreferencesRepository';
import { GitHubIssueRepository } from 'src/infra/repositories/GitHubIssueRepository';
import { GitHubRepoRepository } from 'src/infra/repositories/GitHubRepoRepository';
import { GitHubUserRepository } from 'src/infra/repositories/GitHubUserRepository';
import { InMemoryIssueRepository } from 'src/infra/repositories/InMemoryIssueRepository';
import { InMemoryRepoRepository } from 'src/infra/repositories/InMemoryRepoRepository';
import { InMemorySavedReposRepository } from 'src/infra/repositories/InMemorySavedReposRepository';
import { InMemoryUserPreferencesRepository } from 'src/infra/repositories/InMemoryUserPreferencesRepository';
import { InMemoryUserRepository } from 'src/infra/repositories/InMemoryUserRepository';

export interface DiEnv {
  USE_MOCK: boolean;
}

export const readDiEnv = (): DiEnv => ({
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK !== 'false',
});

export const provideRepoRepository = (env: DiEnv): IRepoRepository =>
  env.USE_MOCK ? new InMemoryRepoRepository() : new GitHubRepoRepository();

export const provideIssueRepository = (env: DiEnv): IIssueRepository =>
  env.USE_MOCK ? new InMemoryIssueRepository() : new GitHubIssueRepository();

export const provideSavedReposRepository = (env: DiEnv): ISavedReposRepository =>
  env.USE_MOCK ? new InMemorySavedReposRepository() : new AsyncStorageSavedReposRepository();

export const provideUserRepository = (env: DiEnv): IUserRepository =>
  env.USE_MOCK ? new InMemoryUserRepository() : new GitHubUserRepository();

export const provideUserPreferencesRepository = (env: DiEnv): IUserPreferencesRepository =>
  env.USE_MOCK
    ? new InMemoryUserPreferencesRepository()
    : new AsyncStorageUserPreferencesRepository();

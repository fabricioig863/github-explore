import { createContainer, type Container } from 'src/infra/di/container';
import {
  provideAnalytics,
  provideCrashReporter,
  provideIssueRepository,
  provideRepoRepository,
  provideSavedReposRepository,
  provideUserPreferencesRepository,
  provideUserRepository,
  readDiEnv,
} from 'src/infra/di/providers';

const env = readDiEnv();

export const container: Container = createContainer({
  repoRepository: provideRepoRepository(env),
  issueRepository: provideIssueRepository(env),
  savedReposRepository: provideSavedReposRepository(env),
  userRepository: provideUserRepository(env),
  userPreferencesRepository: provideUserPreferencesRepository(env),
  analytics: provideAnalytics(env),
  crashReporter: provideCrashReporter(env),
});

import type { Container } from 'src/infra/di/container';

import { FakeAnalytics, FakeCrashReporter } from './FakeAnalytics';

type UseCaseKeys = Exclude<keyof Container, 'analytics' | 'crashReporter'>;

export type FakeContainer = { [K in UseCaseKeys]: { execute: jest.Mock } } & {
  analytics: FakeAnalytics;
  crashReporter: FakeCrashReporter;
};

export const makeFakeContainer = (): FakeContainer => ({
  searchReposUseCase: { execute: jest.fn() },
  getRepoDetailsUseCase: { execute: jest.fn() },
  listIssuesUseCase: { execute: jest.fn() },
  countIssuesUseCase: { execute: jest.fn() },
  listSavedReposUseCase: { execute: jest.fn() },
  saveRepoUseCase: { execute: jest.fn() },
  unsaveRepoUseCase: { execute: jest.fn() },
  isRepoSavedUseCase: { execute: jest.fn() },
  listUserReposUseCase: { execute: jest.fn() },
  getTopUserReposUseCase: { execute: jest.fn() },
  getUserProfileUseCase: { execute: jest.fn() },
  getUserPreferencesUseCase: { execute: jest.fn() },
  updateUserPreferencesUseCase: { execute: jest.fn() },
  analytics: new FakeAnalytics(),
  crashReporter: new FakeCrashReporter(),
});

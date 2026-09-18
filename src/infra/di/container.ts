import { CountIssuesUseCase } from '@/application/use-cases/CountIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/use-cases/GetRepoDetailsUseCase';
import { GetTopUserReposUseCase } from '@/application/use-cases/GetTopUserReposUseCase';
import { GetUserProfileUseCase } from '@/application/use-cases/GetUserProfileUseCase';
import { GetUserPreferencesUseCase } from '@/application/use-cases/GetUserPreferencesUseCase';
import { IsRepoSavedUseCase } from '@/application/use-cases/IsRepoSavedUseCase';
import { ListIssuesUseCase } from '@/application/use-cases/ListIssuesUseCase';
import { ListSavedReposUseCase } from '@/application/use-cases/ListSavedReposUseCase';
import { ListUserReposUseCase } from '@/application/use-cases/ListUserReposUseCase';
import { SaveRepoUseCase } from '@/application/use-cases/SaveRepoUseCase';
import { SearchReposUseCase } from '@/application/use-cases/SearchReposUseCase';
import { UnsaveRepoUseCase } from '@/application/use-cases/UnsaveRepoUseCase';
import { UpdateUserPreferencesUseCase } from '@/application/use-cases/UpdateUserPreferencesUseCase';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { ICrashReporter } from '@/domain/observability/ICrashReporter';
import type { IIssueRepository } from '@/domain/repositories/IIssueRepository';
import type { IRepoRepository } from '@/domain/repositories/IRepoRepository';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

export interface ContainerDeps {
  repoRepository: IRepoRepository;
  issueRepository: IIssueRepository;
  savedReposRepository: ISavedReposRepository;
  userRepository: IUserRepository;
  userPreferencesRepository: IUserPreferencesRepository;
  analytics: IAnalytics;
  crashReporter: ICrashReporter;
}

export interface Container {
  searchReposUseCase: SearchReposUseCase;
  getRepoDetailsUseCase: GetRepoDetailsUseCase;
  listIssuesUseCase: ListIssuesUseCase;
  countIssuesUseCase: CountIssuesUseCase;
  listSavedReposUseCase: ListSavedReposUseCase;
  saveRepoUseCase: SaveRepoUseCase;
  unsaveRepoUseCase: UnsaveRepoUseCase;
  isRepoSavedUseCase: IsRepoSavedUseCase;
  listUserReposUseCase: ListUserReposUseCase;
  getTopUserReposUseCase: GetTopUserReposUseCase;
  getUserProfileUseCase: GetUserProfileUseCase;
  getUserPreferencesUseCase: GetUserPreferencesUseCase;
  updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;
  analytics: IAnalytics;
  crashReporter: ICrashReporter;
}

export const createContainer = (deps: ContainerDeps): Container => ({
  searchReposUseCase: new SearchReposUseCase(deps.repoRepository, deps.analytics),
  getRepoDetailsUseCase: new GetRepoDetailsUseCase(deps.repoRepository),
  listIssuesUseCase: new ListIssuesUseCase(deps.issueRepository),
  countIssuesUseCase: new CountIssuesUseCase(deps.issueRepository),
  listSavedReposUseCase: new ListSavedReposUseCase(deps.savedReposRepository),
  saveRepoUseCase: new SaveRepoUseCase(deps.savedReposRepository, deps.analytics),
  unsaveRepoUseCase: new UnsaveRepoUseCase(deps.savedReposRepository, deps.analytics),
  isRepoSavedUseCase: new IsRepoSavedUseCase(deps.savedReposRepository),
  listUserReposUseCase: new ListUserReposUseCase(deps.userRepository),
  getTopUserReposUseCase: new GetTopUserReposUseCase(new ListUserReposUseCase(deps.userRepository)),
  getUserProfileUseCase: new GetUserProfileUseCase(deps.userRepository),
  getUserPreferencesUseCase: new GetUserPreferencesUseCase(deps.userPreferencesRepository),
  updateUserPreferencesUseCase: new UpdateUserPreferencesUseCase(deps.userPreferencesRepository),
  analytics: deps.analytics,
  crashReporter: deps.crashReporter,
});

import { CountIssuesUseCase } from '@/application/use-cases/CountIssuesUseCase';
import { GetCurrentSessionUseCase } from '@/application/use-cases/GetCurrentSessionUseCase';
import { GetRepoDetailsUseCase } from '@/application/use-cases/GetRepoDetailsUseCase';
import { GetTopUserReposUseCase } from '@/application/use-cases/GetTopUserReposUseCase';
import { GetUserPreferencesUseCase } from '@/application/use-cases/GetUserPreferencesUseCase';
import { IsRepoSavedUseCase } from '@/application/use-cases/IsRepoSavedUseCase';
import { ListIssuesUseCase } from '@/application/use-cases/ListIssuesUseCase';
import { ListSavedReposUseCase } from '@/application/use-cases/ListSavedReposUseCase';
import { ListUserReposUseCase } from '@/application/use-cases/ListUserReposUseCase';
import { SaveRepoUseCase } from '@/application/use-cases/SaveRepoUseCase';
import { SearchReposUseCase } from '@/application/use-cases/SearchReposUseCase';
import { SignInWithGithubUseCase } from '@/application/use-cases/SignInWithGithubUseCase';
import { SignOutUseCase } from '@/application/use-cases/SignOutUseCase';
import { UnsaveRepoUseCase } from '@/application/use-cases/UnsaveRepoUseCase';
import { UpdateUserPreferencesUseCase } from '@/application/use-cases/UpdateUserPreferencesUseCase';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import type { IIssueRepository } from '@/domain/repositories/IIssueRepository';
import type { IRepoRepository } from '@/domain/repositories/IRepoRepository';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

export interface ContainerDeps {
  repoRepository: IRepoRepository;
  issueRepository: IIssueRepository;
  savedReposRepository: ISavedReposRepository;
  authRepository: IAuthRepository;
  userRepository: IUserRepository;
  userPreferencesRepository: IUserPreferencesRepository;
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
  signInWithGithubUseCase: SignInWithGithubUseCase;
  signOutUseCase: SignOutUseCase;
  getCurrentSessionUseCase: GetCurrentSessionUseCase;
  listUserReposUseCase: ListUserReposUseCase;
  getTopUserReposUseCase: GetTopUserReposUseCase;
  getUserPreferencesUseCase: GetUserPreferencesUseCase;
  updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;
}

export const createContainer = (deps: ContainerDeps): Container => ({
  searchReposUseCase: new SearchReposUseCase(deps.repoRepository),
  getRepoDetailsUseCase: new GetRepoDetailsUseCase(deps.repoRepository),
  listIssuesUseCase: new ListIssuesUseCase(deps.issueRepository),
  countIssuesUseCase: new CountIssuesUseCase(deps.issueRepository),
  listSavedReposUseCase: new ListSavedReposUseCase(deps.savedReposRepository),
  saveRepoUseCase: new SaveRepoUseCase(deps.savedReposRepository),
  unsaveRepoUseCase: new UnsaveRepoUseCase(deps.savedReposRepository),
  isRepoSavedUseCase: new IsRepoSavedUseCase(deps.savedReposRepository),
  signInWithGithubUseCase: new SignInWithGithubUseCase(deps.authRepository),
  signOutUseCase: new SignOutUseCase(deps.authRepository),
  getCurrentSessionUseCase: new GetCurrentSessionUseCase(deps.authRepository),
  listUserReposUseCase: new ListUserReposUseCase(deps.userRepository),
  getTopUserReposUseCase: new GetTopUserReposUseCase(
    new ListUserReposUseCase(deps.userRepository),
  ),
  getUserPreferencesUseCase: new GetUserPreferencesUseCase(deps.userPreferencesRepository),
  updateUserPreferencesUseCase: new UpdateUserPreferencesUseCase(deps.userPreferencesRepository),
});

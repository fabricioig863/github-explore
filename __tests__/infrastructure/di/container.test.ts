import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { ICrashReporter } from '@/domain/observability/ICrashReporter';
import type { IIssueRepository } from '@/domain/repositories/IIssueRepository';
import type { IRepoRepository } from '@/domain/repositories/IRepoRepository';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { createContainer, type ContainerDeps } from 'src/infra/di/container';

function fakeRepoRepository(): IRepoRepository {
  return {
    search: jest.fn(),
    getDetails: jest.fn(),
  } as unknown as IRepoRepository;
}

function fakeIssueRepository(): IIssueRepository {
  return {
    list: jest.fn(),
    count: jest.fn(),
  } as unknown as IIssueRepository;
}

function fakeSavedReposRepository(): ISavedReposRepository {
  return {
    list: jest.fn(),
    save: jest.fn(),
    unsave: jest.fn(),
    isSaved: jest.fn(),
  } as unknown as ISavedReposRepository;
}

function fakeUserRepository(): IUserRepository {
  return {
    getUser: jest.fn(),
    listUserRepos: jest.fn(),
  } as unknown as IUserRepository;
}

function fakeUserPreferencesRepository(): IUserPreferencesRepository {
  return {
    get: jest.fn(),
    update: jest.fn(),
  } as unknown as IUserPreferencesRepository;
}

function makeDeps(overrides: Partial<ContainerDeps> = {}): ContainerDeps {
  return {
    repoRepository: fakeRepoRepository(),
    issueRepository: fakeIssueRepository(),
    savedReposRepository: fakeSavedReposRepository(),
    userRepository: fakeUserRepository(),
    userPreferencesRepository: fakeUserPreferencesRepository(),
    analytics: { track: jest.fn(), trackScreen: jest.fn() } as IAnalytics,
    crashReporter: { recordError: jest.fn(), log: jest.fn() } as ICrashReporter,
    ...overrides,
  };
}

function readInjectedRepo(useCase: object, key: string): unknown {
  return Reflect.get(useCase, key);
}

describe('createContainer', () => {
  describe('shape', () => {
    it('expõe os 15 use cases esperados, todos com método execute', () => {
      const c = createContainer(makeDeps());

      expect(typeof c.searchReposUseCase.execute).toBe('function');
      expect(typeof c.getRepoDetailsUseCase.execute).toBe('function');
      expect(typeof c.listIssuesUseCase.execute).toBe('function');
      expect(typeof c.countIssuesUseCase.execute).toBe('function');
      expect(typeof c.listSavedReposUseCase.execute).toBe('function');
      expect(typeof c.saveRepoUseCase.execute).toBe('function');
      expect(typeof c.unsaveRepoUseCase.execute).toBe('function');
      expect(typeof c.isRepoSavedUseCase.execute).toBe('function');
      expect(typeof c.listUserReposUseCase.execute).toBe('function');
      expect(typeof c.getTopUserReposUseCase.execute).toBe('function');
      expect(typeof c.getUserPreferencesUseCase.execute).toBe('function');
      expect(typeof c.updateUserPreferencesUseCase.execute).toBe('function');
    });
  });

  describe('injeção de dependência', () => {
    it('use cases recebem exatamente os repositórios passados em deps', () => {
      const deps = makeDeps();
      const c = createContainer(deps);

      expect(readInjectedRepo(c.searchReposUseCase, 'repoRepository')).toBe(deps.repoRepository);
      expect(readInjectedRepo(c.getRepoDetailsUseCase, 'repoRepository')).toBe(deps.repoRepository);

      expect(readInjectedRepo(c.listIssuesUseCase, 'issueRepository')).toBe(deps.issueRepository);
      expect(readInjectedRepo(c.countIssuesUseCase, 'issueRepository')).toBe(deps.issueRepository);

      expect(readInjectedRepo(c.listSavedReposUseCase, 'savedReposRepository')).toBe(
        deps.savedReposRepository,
      );
      expect(readInjectedRepo(c.saveRepoUseCase, 'savedReposRepository')).toBe(
        deps.savedReposRepository,
      );
      expect(readInjectedRepo(c.unsaveRepoUseCase, 'savedReposRepository')).toBe(
        deps.savedReposRepository,
      );
      expect(readInjectedRepo(c.isRepoSavedUseCase, 'savedReposRepository')).toBe(
        deps.savedReposRepository,
      );

      expect(readInjectedRepo(c.listUserReposUseCase, 'userRepository')).toBe(deps.userRepository);

      expect(readInjectedRepo(c.getUserPreferencesUseCase, 'preferencesRepository')).toBe(
        deps.userPreferencesRepository,
      );
      expect(readInjectedRepo(c.updateUserPreferencesUseCase, 'preferencesRepository')).toBe(
        deps.userPreferencesRepository,
      );
    });

    it('use cases que compartilham mesma interface compartilham a mesma instância (não duplica)', () => {
      const c = createContainer(makeDeps());

      expect(readInjectedRepo(c.searchReposUseCase, 'repoRepository')).toBe(
        readInjectedRepo(c.getRepoDetailsUseCase, 'repoRepository'),
      );
      expect(readInjectedRepo(c.listIssuesUseCase, 'issueRepository')).toBe(
        readInjectedRepo(c.countIssuesUseCase, 'issueRepository'),
      );
      expect(readInjectedRepo(c.saveRepoUseCase, 'savedReposRepository')).toBe(
        readInjectedRepo(c.listSavedReposUseCase, 'savedReposRepository'),
      );
    });

    it('chamadas independentes produzem containers independentes (sem estado global)', () => {
      const a = createContainer(makeDeps());
      const b = createContainer(makeDeps());

      expect(a.searchReposUseCase).not.toBe(b.searchReposUseCase);
      expect(readInjectedRepo(a.searchReposUseCase, 'repoRepository')).not.toBe(
        readInjectedRepo(b.searchReposUseCase, 'repoRepository'),
      );
    });
  });
});

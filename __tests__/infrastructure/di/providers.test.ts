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

describe('di/providers', () => {
  describe('readDiEnv', () => {
    const originalEnv = process.env.EXPO_PUBLIC_USE_MOCK;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.EXPO_PUBLIC_USE_MOCK;
      } else {
        process.env.EXPO_PUBLIC_USE_MOCK = originalEnv;
      }
    });

    it('USE_MOCK=true quando EXPO_PUBLIC_USE_MOCK está ausente', () => {
      delete process.env.EXPO_PUBLIC_USE_MOCK;
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=true quando EXPO_PUBLIC_USE_MOCK="true"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'true';
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=true para qualquer valor diferente de "false"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'yes';
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=false somente quando EXPO_PUBLIC_USE_MOCK="false"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'false';
      expect(readDiEnv()).toEqual({ USE_MOCK: false, DEBUG_ANALYTICS: false });
    });
  });

  describe('provideRepoRepository', () => {
    it('retorna InMemoryRepoRepository quando USE_MOCK=true', () => {
      const repo = provideRepoRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryRepoRepository');
    });

    it('retorna GitHubRepoRepository quando USE_MOCK=false', () => {
      const repo = provideRepoRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubRepoRepository');
    });
  });

  describe('provideIssueRepository', () => {
    it('retorna InMemoryIssueRepository quando USE_MOCK=true', () => {
      const repo = provideIssueRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryIssueRepository');
    });

    it('retorna GitHubIssueRepository quando USE_MOCK=false', () => {
      const repo = provideIssueRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubIssueRepository');
    });
  });

  describe('provideSavedReposRepository', () => {
    it('retorna InMemorySavedReposRepository quando USE_MOCK=true', () => {
      const repo = provideSavedReposRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemorySavedReposRepository');
    });

    it('retorna AsyncStorageSavedReposRepository quando USE_MOCK=false', () => {
      const repo = provideSavedReposRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('AsyncStorageSavedReposRepository');
    });
  });

  describe('provideUserRepository', () => {
    it('retorna InMemoryUserRepository quando USE_MOCK=true', () => {
      const repo = provideUserRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryUserRepository');
    });

    it('retorna GitHubUserRepository quando USE_MOCK=false', () => {
      const repo = provideUserRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubUserRepository');
    });
  });

  describe('provideUserPreferencesRepository', () => {
    it('retorna InMemoryUserPreferencesRepository quando USE_MOCK=true', () => {
      const repo = provideUserPreferencesRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryUserPreferencesRepository');
    });

    it('retorna AsyncStorageUserPreferencesRepository quando USE_MOCK=false', () => {
      const repo = provideUserPreferencesRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('AsyncStorageUserPreferencesRepository');
    });
  });
});

describe('provideAnalytics e provideCrashReporter', () => {
  it('sem DEBUG_ANALYTICS usam os adaptadores no-op', () => {
    const env = { USE_MOCK: true, DEBUG_ANALYTICS: false };
    expect(provideAnalytics(env).constructor.name).toBe('NoopAnalytics');
    expect(provideCrashReporter(env).constructor.name).toBe('NoopCrashReporter');
  });

  it('com DEBUG_ANALYTICS usam os adaptadores de console', () => {
    const env = { USE_MOCK: false, DEBUG_ANALYTICS: true };
    expect(provideAnalytics(env).constructor.name).toBe('ConsoleAnalytics');
    expect(provideCrashReporter(env).constructor.name).toBe('ConsoleCrashReporter');
  });

  it('a escolha não depende de USE_MOCK: observabilidade é ortogonal aos mocks', () => {
    expect(provideAnalytics({ USE_MOCK: true, DEBUG_ANALYTICS: false }).constructor.name).toBe(
      provideAnalytics({ USE_MOCK: false, DEBUG_ANALYTICS: false }).constructor.name,
    );
  });
});

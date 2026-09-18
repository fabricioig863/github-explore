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

    it('USE_MOCK=true when EXPO_PUBLIC_USE_MOCK is absent', () => {
      delete process.env.EXPO_PUBLIC_USE_MOCK;
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=true when EXPO_PUBLIC_USE_MOCK="true"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'true';
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=true for any value other than "false"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'yes';
      expect(readDiEnv()).toEqual({ USE_MOCK: true, DEBUG_ANALYTICS: false });
    });

    it('USE_MOCK=false only when EXPO_PUBLIC_USE_MOCK="false"', () => {
      process.env.EXPO_PUBLIC_USE_MOCK = 'false';
      expect(readDiEnv()).toEqual({ USE_MOCK: false, DEBUG_ANALYTICS: false });
    });
  });

  describe('provideRepoRepository', () => {
    it('returns InMemoryRepoRepository when USE_MOCK=true', () => {
      const repo = provideRepoRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryRepoRepository');
    });

    it('returns GitHubRepoRepository when USE_MOCK=false', () => {
      const repo = provideRepoRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubRepoRepository');
    });
  });

  describe('provideIssueRepository', () => {
    it('returns InMemoryIssueRepository when USE_MOCK=true', () => {
      const repo = provideIssueRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryIssueRepository');
    });

    it('returns GitHubIssueRepository when USE_MOCK=false', () => {
      const repo = provideIssueRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubIssueRepository');
    });
  });

  describe('provideSavedReposRepository', () => {
    it('returns InMemorySavedReposRepository when USE_MOCK=true', () => {
      const repo = provideSavedReposRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemorySavedReposRepository');
    });

    it('returns AsyncStorageSavedReposRepository when USE_MOCK=false', () => {
      const repo = provideSavedReposRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('AsyncStorageSavedReposRepository');
    });
  });

  describe('provideUserRepository', () => {
    it('returns InMemoryUserRepository when USE_MOCK=true', () => {
      const repo = provideUserRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryUserRepository');
    });

    it('returns GitHubUserRepository when USE_MOCK=false', () => {
      const repo = provideUserRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('GitHubUserRepository');
    });
  });

  describe('provideUserPreferencesRepository', () => {
    it('returns InMemoryUserPreferencesRepository when USE_MOCK=true', () => {
      const repo = provideUserPreferencesRepository({ USE_MOCK: true, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('InMemoryUserPreferencesRepository');
    });

    it('returns AsyncStorageUserPreferencesRepository when USE_MOCK=false', () => {
      const repo = provideUserPreferencesRepository({ USE_MOCK: false, DEBUG_ANALYTICS: false });
      expect(repo.constructor.name).toBe('AsyncStorageUserPreferencesRepository');
    });
  });
});

describe('provideAnalytics and provideCrashReporter', () => {
  it('with DEBUG_ANALYTICS they use the console adapters, even outside mock mode', () => {
    const env = { USE_MOCK: false, DEBUG_ANALYTICS: true };
    expect(provideAnalytics(env).constructor.name).toBe('ConsoleAnalytics');
    expect(provideCrashReporter(env).constructor.name).toBe('ConsoleCrashReporter');
  });

  it('in mock mode they use no-op adapters, since the real ones need native modules', () => {
    const env = { USE_MOCK: true, DEBUG_ANALYTICS: false };
    expect(provideAnalytics(env).constructor.name).toBe('NoopAnalytics');
    expect(provideCrashReporter(env).constructor.name).toBe('NoopCrashReporter');
  });

  it('outside mock mode they use Firebase', () => {
    const env = { USE_MOCK: false, DEBUG_ANALYTICS: false };
    expect(provideAnalytics(env).constructor.name).toBe('FirebaseAnalytics');
    expect(provideCrashReporter(env).constructor.name).toBe('FirebaseCrashReporter');
  });

  it('DEBUG_ANALYTICS takes precedence over USE_MOCK', () => {
    expect(provideAnalytics({ USE_MOCK: true, DEBUG_ANALYTICS: true }).constructor.name).toBe(
      'ConsoleAnalytics',
    );
  });
});

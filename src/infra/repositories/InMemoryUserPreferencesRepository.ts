import type { UserPreferences } from '@/domain/entities/UserPreferences';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';

export class InMemoryUserPreferencesRepository implements IUserPreferencesRepository {
  private prefs: UserPreferences;

  constructor(initial: UserPreferences = { localAvatarUri: null }) {
    this.prefs = { ...initial };
  }

  async get(): Promise<UserPreferences> {
    return { ...this.prefs };
  }

  async update(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    this.prefs = { ...this.prefs, ...prefs };
    return { ...this.prefs };
  }
}

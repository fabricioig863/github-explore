import type { UserPreferences } from '@/domain/entities/UserPreferences';

export interface IUserPreferencesRepository {
  get(): Promise<UserPreferences>;
  update(prefs: Partial<UserPreferences>): Promise<UserPreferences>;
}

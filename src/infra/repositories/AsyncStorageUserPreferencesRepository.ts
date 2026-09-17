import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserPreferences } from '@/domain/entities/UserPreferences';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';

const STORAGE_KEY = '@github-explorer:user-prefs:v1';

const DEFAULT_PREFS: UserPreferences = {
  localAvatarUri: null,
};

export class AsyncStorageUserPreferencesRepository implements IUserPreferencesRepository {
  async get(): Promise<UserPreferences> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_PREFS };
    try {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return { ...DEFAULT_PREFS, ...parsed };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }

  async update(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.get();
    const next: UserPreferences = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
}

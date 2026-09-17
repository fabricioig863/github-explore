import type { UserPreferences } from '@/domain/entities/UserPreferences';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';

export class FakeUserPreferencesRepository implements IUserPreferencesRepository {
  get: jest.Mock<Promise<UserPreferences>, []>;
  update: jest.Mock<Promise<UserPreferences>, [Partial<UserPreferences>]>;

  constructor(defaults?: { get?: UserPreferences; update?: UserPreferences }) {
    this.get = jest.fn().mockResolvedValue(defaults?.get ?? { localAvatarUri: null });
    this.update = jest.fn().mockResolvedValue(defaults?.update ?? { localAvatarUri: null });
  }
}

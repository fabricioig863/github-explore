import type { UserPreferences } from '@/domain/entities/UserPreferences';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';

export class UpdateUserPreferencesUseCase {
  constructor(private readonly preferencesRepository: IUserPreferencesRepository) {}

  async execute(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.preferencesRepository.update(prefs);
  }
}

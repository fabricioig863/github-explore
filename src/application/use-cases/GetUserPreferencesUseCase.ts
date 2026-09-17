import type { UserPreferences } from '@/domain/entities/UserPreferences';
import type { IUserPreferencesRepository } from '@/domain/repositories/IUserPreferencesRepository';

export class GetUserPreferencesUseCase {
  constructor(private readonly preferencesRepository: IUserPreferencesRepository) {}

  async execute(): Promise<UserPreferences> {
    return this.preferencesRepository.get();
  }
}

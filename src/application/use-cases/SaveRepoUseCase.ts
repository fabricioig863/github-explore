import { assertNonEmpty } from '@/application/validation/assertInput';
import type { Repository } from '@/domain/entities/Repository';
import type { SavedRepo } from '@/domain/entities/SavedRepo';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';
import { categorizeSavedRepo } from '@/domain/services/repoCategorization';

export class SaveRepoUseCase {
  constructor(
    private readonly savedReposRepository: ISavedReposRepository,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(repo: Repository): Promise<SavedRepo> {
    assertNonEmpty(repo.fullName, 'Repositório inválido para salvar.');

    const saved = await this.savedReposRepository.save(repo);

    this.analytics.track({
      name: 'repo_saved',
      fullName: saved.fullName,
      collection: categorizeSavedRepo(saved),
    });

    return saved;
  }
}

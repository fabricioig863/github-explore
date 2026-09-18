import { assertNonEmpty } from '@/application/validation/assertInput';
import type { IAnalytics } from '@/domain/observability/IAnalytics';
import type { ISavedReposRepository } from '@/domain/repositories/ISavedReposRepository';

export class UnsaveRepoUseCase {
  constructor(
    private readonly savedReposRepository: ISavedReposRepository,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(fullName: string): Promise<void> {
    const trimmed = assertNonEmpty(fullName, 'fullName é obrigatório para remover dos salvos.');

    await this.savedReposRepository.unsave(trimmed);

    this.analytics.track({ name: 'repo_unsaved', fullName: trimmed });
  }
}

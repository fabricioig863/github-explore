import type { SavedRepo } from '@/domain/entities/SavedRepo';
import { COLLECTION_RULES, categorizeSavedRepo } from '@/domain/services/repoCategorization';
import type { CollectionId } from '@/domain/services/repoCategorization';

export type { CollectionId };

export interface CollectionMeta {
  id: CollectionId;
  title: string;
  iconColor: string;
  glyph: string;
}

// Só aparência. Quem decide o que entra em cada coleção — e em que ordem de
// prioridade — é COLLECTION_RULES, no domínio.
const COLLECTION_APPEARANCE: Record<CollectionId, Omit<CollectionMeta, 'id'>> = {
  mobile: { title: 'Mobile', iconColor: '#5B6CFF', glyph: '☰' },
  backend: { title: 'Backend', iconColor: '#C53030', glyph: '▨' },
  web: { title: 'Web', iconColor: '#2B6CB0', glyph: '◈' },
  tools: { title: 'Ferramentas', iconColor: '#2F855A', glyph: '⛭' },
  'ai-ml': { title: 'AI & ML', iconColor: '#B7791F', glyph: '✪' },
};

// Ordem de exibição fixa, independente da ordem de prioridade das regras: a
// prioridade muda conforme o mapeamento evolui, mas a grade não deve dançar.
const DISPLAY_ORDER: readonly CollectionId[] = ['mobile', 'backend', 'web', 'tools', 'ai-ml'];

export const COLLECTIONS: readonly CollectionMeta[] = DISPLAY_ORDER.map((id) => ({
  id,
  ...COLLECTION_APPEARANCE[id],
}));

export function categorize(repo: SavedRepo): CollectionId | null {
  return categorizeSavedRepo(repo);
}

export function emptyCounts(): Record<CollectionId, number> {
  const acc = {} as Record<CollectionId, number>;
  for (const rule of COLLECTION_RULES) acc[rule.collection] = 0;
  return acc;
}

export function countByCollection(repos: readonly SavedRepo[]): Record<CollectionId, number> {
  const acc = emptyCounts();
  for (const repo of repos) {
    const id = categorize(repo);
    if (id !== null) acc[id] += 1;
  }
  return acc;
}

export function reposInCollection(
  repos: readonly SavedRepo[],
  id: CollectionId,
): readonly SavedRepo[] {
  return repos.filter((repo) => categorize(repo) === id);
}

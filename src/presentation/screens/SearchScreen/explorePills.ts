import { Flame } from 'lucide-react-native';
import type { ComponentType } from 'react';

type PillIcon = ComponentType<{ size?: number; color?: string }>;

export interface PillDef {
  id: string;
  label: string;
  /** Query crua passada ao repoQueries.search (buildSearchQuery a refina depois). */
  query: string;
  /** Ícone opcional renderizado à esquerda (cor decidida pelo PillRow conforme seleção). */
  Icon?: PillIcon;
}

export const EXPLORE_PILLS: readonly PillDef[] = [
  { id: 'trending', label: 'Trending', query: 'stars:>10000', Icon: Flame },
  { id: 'mobile', label: 'Mobile', query: 'mobile' },
  { id: 'ts', label: 'TypeScript', query: 'language:typescript' },
  { id: 'rust', label: 'Rust', query: 'language:rust' },
  { id: 'ai', label: 'AI', query: 'ai' },
];

export const DEFAULT_PILL_ID = 'trending';

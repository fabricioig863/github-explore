import { Flame } from 'lucide-react-native';
import type { ComponentType } from 'react';

type PillIcon = ComponentType<{ size?: number; color?: string }>;

export interface PillDef {
  id: string;
  label: string;

  query: string;

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

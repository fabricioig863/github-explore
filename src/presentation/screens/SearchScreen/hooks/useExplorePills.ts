import { useCallback, useState } from 'react';

import { DEFAULT_PILL_ID, EXPLORE_PILLS, type PillDef } from '../explorePills';

interface UseExplorePills {
  pills: readonly PillDef[];
  selectedId: string;
  select: (id: string) => void;

  query: string;
}

export function useExplorePills(): UseExplorePills {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PILL_ID);

  const select = useCallback((id: string) => setSelectedId(id), []);

  const query = EXPLORE_PILLS.find((pill) => pill.id === selectedId)?.query ?? '';

  return { pills: EXPLORE_PILLS, selectedId, select, query };
}

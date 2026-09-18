import { useTheme } from '@shopify/restyle';
import { FlatList, type ListRenderItem } from 'react-native';

import type { SavedRepo } from '@/domain/entities/SavedRepo';
import { CollectionCard } from '@/presentation/components/CollectionCard';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import {
  COLLECTIONS,
  reposInCollection,
  type CollectionId,
} from '@/presentation/utils/savedCollections';
import type { Theme } from 'src/infra/theme/lightTheme';

import { CollectionsEmpty } from './CollectionsEmpty';

const CARDS_PER_ROW = 2;

const COLLECTION_ROWS = COLLECTIONS.reduce<(typeof COLLECTIONS)[number][][]>((rows, collection) => {
  const last = rows[rows.length - 1];
  if (last === undefined || last.length === CARDS_PER_ROW) rows.push([collection]);
  else last.push(collection);
  return rows;
}, []);

interface CollectionsViewProps {
  counts: Record<CollectionId, number>;
  totalCount: number;
  savedRepos: readonly SavedRepo[];
  activeCollection: CollectionId | null;
  onSelectCollection: (id: CollectionId | null) => void;
  renderRow: ListRenderItem<SavedRepo>;
}

export function CollectionsView({
  counts,
  totalCount,
  savedRepos,
  activeCollection,
  onSelectCollection,
  renderRow,
}: CollectionsViewProps) {
  const theme = useTheme<Theme>();
  const filtered =
    activeCollection === null ? savedRepos : reposInCollection(savedRepos, activeCollection);
  const recent = filtered.slice(0, 4);

  return (
    <FlatList
      data={recent}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderRow}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.huge,
        paddingBottom: theme.spacing.giga,
        gap: theme.spacing.md,
      }}
      ListHeaderComponent={
        <Box gap="xl">
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text variant="eyebrow">SUAS COLEÇÕES · {COLLECTIONS.length}</Text>
          </Box>

          {COLLECTION_ROWS.map((row) => (
            <Box key={row.map((c) => c.id).join('-')} flexDirection="row" gap="md">
              {row.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  title={collection.title}
                  count={counts[collection.id]}
                  iconColor={collection.iconColor}
                  glyph={collection.glyph}
                  onPress={() =>
                    onSelectCollection(activeCollection === collection.id ? null : collection.id)
                  }
                />
              ))}
              {row.length === 1 ? <Box flex={1} /> : null}
            </Box>
          ))}
          <Box paddingTop="huge">
            <Text variant="eyebrow">
              {activeCollection === null
                ? `SALVOS RECENTEMENTE${totalCount > 0 ? ` · ${totalCount}` : ''}`
                : `EM ${COLLECTIONS.find((c) => c.id === activeCollection)?.title.toUpperCase() ?? ''}`}
            </Text>
          </Box>
        </Box>
      }
      ListEmptyComponent={
        <Box paddingTop="huge">
          <CollectionsEmpty />
        </Box>
      }
    />
  );
}

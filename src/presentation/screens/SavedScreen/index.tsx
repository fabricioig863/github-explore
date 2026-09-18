import { useTheme } from '@shopify/restyle';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SavedRepo } from '@/domain/entities/SavedRepo';
import { EmptyState } from '@/presentation/components/EmptyState';
import { SavedRepoRow } from '@/presentation/components/SavedRepoRow';
import { SegmentedTabs, type SegmentedTab } from '@/presentation/components/SegmentedTabs';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { savedQueries } from '@/presentation/query/collections/savedQueries';
import { useRouter } from 'expo-router';

import { getErrorMessage } from '@/presentation/utils/getErrorMessage';
import { countByCollection, type CollectionId } from '@/presentation/utils/savedCollections';
import type { Theme } from 'src/infra/theme/lightTheme';

import { CollectionsView } from './components/CollectionsView';
import { RecentList } from './components/RecentList';
import { SavedScreenSkeleton } from './components/SavedScreenSkeleton';
import { useAnalytics, useTrackScreen } from '@/presentation/hooks/useAnalytics';

type TabId = 'collections' | 'all' | 'recent';

export function SavedScreen() {
  const router = useRouter();
  const theme = useTheme<Theme>();

  const [tab, setTab] = useState<TabId>('collections');
  const [activeCollection, setActiveCollection] = useState<CollectionId | null>(null);

  const analytics = useAnalytics();
  useTrackScreen('saved');

  const selectCollection = (id: CollectionId | null) => {
    setActiveCollection(id);
    if (id !== null) analytics.track({ name: 'collection_opened', collection: id });
  };

  const { data: savedRepos = [], isLoading, error } = useQuery(savedQueries.list());
  const counts = useMemo(() => countByCollection(savedRepos), [savedRepos]);
  const totalCount = savedRepos.length;

  const tabs: readonly SegmentedTab<TabId>[] = useMemo(
    () => [
      { id: 'collections', label: 'Coleções' },
      { id: 'all', label: `Todos · ${totalCount}` },
      { id: 'recent', label: 'Recentes' },
    ],
    [totalCount],
  );

  const handleOpenRepo = (repo: SavedRepo) => {
    router.push(`/${repo.ownerLogin}/${repo.name}`);
  };

  const renderRow: ListRenderItem<SavedRepo> = ({ item }) => (
    <SavedRepoRow repo={item} onPress={() => handleOpenRepo(item)} />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Box paddingHorizontal="huge" paddingTop="md" paddingBottom="huge">
        <Text variant="h1" style={{ letterSpacing: -0.4 }}>
          Salvos
        </Text>
      </Box>

      <Box paddingHorizontal="huge" paddingBottom="huge">
        <SegmentedTabs
          tabs={tabs}
          selected={tab}
          onChange={(id) => {
            setTab(id);
            setActiveCollection(null);
          }}
        />
      </Box>

      {isLoading ? (
        <SavedScreenSkeleton />
      ) : error !== null ? (
        <EmptyState title="Não foi possível carregar" description={getErrorMessage(error)} />
      ) : tab === 'collections' ? (
        <CollectionsView
          counts={counts}
          totalCount={totalCount}
          savedRepos={savedRepos}
          activeCollection={activeCollection}
          onSelectCollection={selectCollection}
          renderRow={renderRow}
        />
      ) : tab === 'all' ? (
        <RecentList
          data={[...savedRepos].sort((a, b) => a.fullName.localeCompare(b.fullName))}
          renderRow={renderRow}
          emptyTitle="Você ainda não salvou nenhum repositório"
          emptyDescription="Toque no ícone de marcador na tela de detalhes para começar."
        />
      ) : (
        <RecentList
          data={savedRepos}
          renderRow={renderRow}
          emptyTitle="Sem atividade recente"
          emptyDescription="Quando você salvar repositórios, eles aparecerão aqui."
        />
      )}
    </SafeAreaView>
  );
}

import { useTheme } from '@shopify/restyle';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, type ListRenderItem } from 'react-native';

import type { Repository } from '@/domain/entities/Repository';
import { EmptyState } from '@/presentation/components/EmptyState';
import { RateLimitBanner } from '@/presentation/components/RateLimitBanner';
import { RepoListItem } from '@/presentation/components/RepoListItem';
import { Skeleton } from '@/presentation/design-system/Skeleton';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Spinner } from '@/presentation/design-system/primitives/Spinner';
import { Text } from '@/presentation/design-system/primitives/Text';
import { useRouter } from 'expo-router';

import { useDebounce } from '@/presentation/hooks/useDebounce';
import { repoQueries } from '@/presentation/query/collections/repoQueries';
import { getEmptySearchCopy } from '@/presentation/utils/getEmptySearchCopy';
import { getErrorMessage } from '@/presentation/utils/getErrorMessage';
import type { Theme } from 'src/infra/theme/lightTheme';

import { PillRow } from './components/PillRow';
import { SearchHeader } from './components/SearchHeader';
import { useExplorePills } from './hooks/useExplorePills';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function SearchScreen() {
  const router = useRouter();
  const theme = useTheme<Theme>();
  const [typed, setTyped] = useState('');
  const { pills, selectedId, select, query: pillQuery } = useExplorePills();

  // Busca livre (>= 2 chars) sobrepõe o filtro de pill; senão usa a pill selecionada.
  const typedQuery = typed.trim();
  const effectiveQuery = typedQuery.length >= MIN_QUERY_LENGTH ? typedQuery : pillQuery;
  const debouncedQuery = useDebounce(effectiveQuery, DEBOUNCE_MS);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    error,
  } = useInfiniteQuery(repoQueries.search(debouncedQuery));

  const repos: Repository[] = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount;

  const handleRepoPress = useCallback(
    (repo: Repository) => {
      router.push(`/${repo.owner.login}/${repo.name}`);
    },
    [router],
  );

  const renderItem: ListRenderItem<Repository> = useCallback(
    ({ item }) => <RepoListItem repo={item} onPress={() => handleRepoPress(item)} />,
    [handleRepoPress],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <Box padding="xxl" alignItems="center">
        <Spinner size="small" color="fgSubtle" />
      </Box>
    );
  };

  const renderBody = (): ReactNode => {
    if (isLoading) {
      return (
        <Box paddingHorizontal="xxxl" paddingTop="md" gap="lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={84} radius={12} />
          ))}
        </Box>
      );
    }

    if (error !== null) {
      return (
        <>
          <RateLimitBanner error={error} />
          <EmptyState
            title="Algo deu errado"
            description={getErrorMessage(error)}
            onRetry={() => {
              void refetch();
            }}
          />
        </>
      );
    }

    if (repos.length === 0) {
      const { title, description } = getEmptySearchCopy(debouncedQuery);
      return <EmptyState title={title} description={description} />;
    }

    return (
      <FlatList
        data={repos}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          totalCount !== undefined ? (
            <Box paddingBottom="md">
              <Text variant="caption">
                Top resultados · {totalCount.toLocaleString('pt-BR')}
              </Text>
            </Box>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xxxl,
          paddingBottom: theme.spacing.giga,
          gap: theme.spacing.lg,
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={theme.colors.fgSubtle}
          />
        }
        ListFooterComponent={renderFooter}
      />
    );
  };

  return (
    <Box flex={1} backgroundColor="bg">
      <SearchHeader query={typed} onChangeQuery={setTyped} />
      <Box paddingTop="sm" paddingBottom="md">
        <PillRow pills={pills} selectedId={selectedId} onSelect={select} />
      </Box>
      <Box flex={1}>{renderBody()}</Box>
    </Box>
  );
}

import { useTheme } from '@shopify/restyle';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, type ListRenderItem } from 'react-native';

import type { Issue } from '@/domain/entities/Issue';
import { EmptyState } from '@/presentation/components/EmptyState';
import { IssueListItem } from '@/presentation/components/IssueListItem';
import { Pill } from '@/presentation/design-system/Pill';
import { Skeleton } from '@/presentation/design-system/Skeleton';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Spinner } from '@/presentation/design-system/primitives/Spinner';
import { Text } from '@/presentation/design-system/primitives/Text';
import { useLocalSearchParams } from 'expo-router';

import { issueQueries } from '@/presentation/query/collections/issueQueries';
import { formatCount } from '@/presentation/utils/formatCount';
import { getErrorMessage } from '@/presentation/utils/getErrorMessage';
import type { Theme } from 'src/infra/theme/lightTheme';
import { useTrackEvent, useTrackScreen } from '@/presentation/hooks/useAnalytics';

type IssueState = 'open' | 'closed';

const formatBadge = (count: number | undefined): string =>
  count !== undefined ? formatCount(count) : '…';

export function IssuesScreen() {
  const { owner, repo } = useLocalSearchParams<{ owner: string; repo: string }>();
  const theme = useTheme<Theme>();
  const [state, setState] = useState<IssueState>('open');

  useTrackScreen('issues');
  useTrackEvent({ name: 'issues_viewed', fullName: `${owner}/${repo}`, state });

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    error,
  } = useInfiniteQuery(issueQueries.list(owner, repo, state));

  const { data: openCount } = useQuery(issueQueries.count(owner, repo, 'open'));
  const { data: closedCount } = useQuery(issueQueries.count(owner, repo, 'closed'));

  const issues: Issue[] = data?.pages.flatMap((p) => p.items) ?? [];

  const renderItem: ListRenderItem<Issue> = useCallback(
    ({ item }) => <IssueListItem issue={item} />,
    [],
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
        <Box paddingHorizontal="xxxl" gap="lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={96} radius={12} />
          ))}
        </Box>
      );
    }

    if (error !== null) {
      return <EmptyState title="Algo deu errado" description={getErrorMessage(error)} />;
    }

    if (issues.length === 0) {
      const label = state === 'open' ? 'aberta' : 'fechada';
      return (
        <EmptyState
          title={`Nenhuma issue ${label}`}
          description={`${owner}/${repo} não possui issues ${label}s no momento.`}
        />
      );
    }

    return (
      <FlatList
        data={issues}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
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
      <Box
        flexDirection="row"
        alignItems="baseline"
        gap="sm"
        paddingHorizontal="xxxl"
        paddingTop="md"
      >
        <Text variant="display">
          {openCount !== undefined ? openCount.toLocaleString('pt-BR') : '—'}
        </Text>
        <Text variant="caption">
          Abertas · {owner}/{repo}
        </Text>
      </Box>

      <Box flexDirection="row" gap="sm" paddingHorizontal="xxxl" paddingTop="md" paddingBottom="md">
        <Pill
          variant="filter"
          selected={state === 'open'}
          label={`Abertas · ${formatBadge(openCount)}`}
          onPress={() => setState('open')}
        />
        <Pill
          variant="filter"
          selected={state === 'closed'}
          label={`Fechadas · ${formatBadge(closedCount)}`}
          onPress={() => setState('closed')}
        />
      </Box>

      <Box flex={1}>{renderBody()}</Box>
    </Box>
  );
}

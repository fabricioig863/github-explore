import { useTheme } from '@shopify/restyle';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Settings, Share2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/presentation/components/EmptyState';
import { Skeleton } from '@/presentation/design-system/Skeleton';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { useAuthSession } from '@/presentation/hooks/useAuthSession';
import { preferencesQueries } from '@/presentation/query/collections/preferencesQueries';
import { userQueries } from '@/presentation/query/collections/userQueries';
import { generatePlaceholderContributions } from '@/presentation/utils/contributions';
import type { Theme } from 'src/infra/theme/lightTheme';

import { ContributionsCard } from './components/ContributionsCard';
import { PinnedRepoCard } from './components/PinnedRepoCard';
import { ProfileHero } from './components/ProfileHero';

export function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme<Theme>();
  const { session } = useAuthSession();
  const user = session?.user ?? null;
  const login = user?.login ?? '';

  const { data: topRepos, isLoading } = useQuery(userQueries.topRepos(login));
  const { data: prefs } = useQuery(preferencesQueries.user());
  const contributions = useMemo(() => generatePlaceholderContributions(login), [login]);

  if (user === null) {
    return (
      <Box flex={1} backgroundColor="bg">
        <EmptyState title="Sessão não encontrada" />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="bg">
      <SafeAreaView edges={['top']}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="huge"
          paddingVertical="md"
        >
          <Text variant="h2">Perfil</Text>
          <Box flexDirection="row" alignItems="center" gap="huge">
            {/* TODO: compartilhar perfil */}
            <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar perfil">
              <Share2 size={20} color={theme.colors.fg} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configurações"
              onPress={() => router.push('/settings')}
            >
              <Settings size={20} color={theme.colors.fg} />
            </Pressable>
          </Box>
        </Box>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.huge, gap: theme.spacing.huge }}>
        <ProfileHero user={user} avatarUri={prefs?.localAvatarUri ?? undefined} />

        <ContributionsCard days={contributions} />

        <Box gap="md">
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text variant="h3">Repositórios em destaque</Text>
            {/* TODO: rota "ver todos os repos do usuário" */}
            <Pressable accessibilityRole="button">
              <Text variant="caption" color="accent">
                Ver tudo
              </Text>
            </Pressable>
          </Box>

          {isLoading ? (
            <Box gap="lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={96} radius={12} />
              ))}
            </Box>
          ) : (
            <Box gap="lg">
              {(topRepos ?? []).map((repo) => (
                <PinnedRepoCard
                  key={repo.id}
                  repo={repo}
                  onPress={() => router.push(`/${repo.owner.login}/${repo.name}`)}
                />
              ))}
            </Box>
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

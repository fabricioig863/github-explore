import { useTheme } from '@shopify/restyle';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/presentation/components/EmptyState';
import { Skeleton } from '@/presentation/design-system/Skeleton';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { preferencesQueries } from '@/presentation/query/collections/preferencesQueries';
import { userQueries } from '@/presentation/query/collections/userQueries';
import { DEFAULT_PROFILE_LOGIN } from '@/presentation/utils/defaultProfile';
import { generatePlaceholderContributions } from '@/presentation/utils/contributions';
import { getErrorMessage } from '@/presentation/utils/getErrorMessage';
import type { Theme } from 'src/infra/theme/lightTheme';

import { ContributionsCard } from './components/ContributionsCard';
import { PinnedRepoCard } from './components/PinnedRepoCard';
import { ProfileHero } from './components/ProfileHero';
import { ProfileSearch } from './components/ProfileSearch';

export function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme<Theme>();

  const [login, setLogin] = useState(DEFAULT_PROFILE_LOGIN);

  const profile = useQuery(userQueries.profile(login));
  const { data: topRepos, isLoading: isLoadingRepos } = useQuery(userQueries.topRepos(login));
  const { data: prefs } = useQuery(preferencesQueries.user());
  const contributions = useMemo(() => generatePlaceholderContributions(login), [login]);

  const isDefaultProfile = login === DEFAULT_PROFILE_LOGIN;
  const avatarOverride = isDefaultProfile ? (prefs?.localAvatarUri ?? undefined) : undefined;

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurações"
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color={theme.colors.fg} />
          </Pressable>
        </Box>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.huge, gap: theme.spacing.huge }}>
        <ProfileSearch value={login} onSubmit={setLogin} />

        {profile.isLoading ? (
          <Box gap="lg" alignItems="center">
            <Skeleton height={96} width={96} radius={48} />
            <Skeleton height={20} width={180} radius={8} />
          </Box>
        ) : profile.isError ? (
          <EmptyState
            title={`Não foi possível carregar @${login}`}
            description={getErrorMessage(profile.error)}
          />
        ) : profile.data !== undefined ? (
          <>
            <ProfileHero user={profile.data} avatarUri={avatarOverride} />

            <ContributionsCard days={contributions} />

            <Box gap="md">
              <Text variant="h3">Repositórios em destaque</Text>

              {isLoadingRepos ? (
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
          </>
        ) : null}
      </ScrollView>
    </Box>
  );
}

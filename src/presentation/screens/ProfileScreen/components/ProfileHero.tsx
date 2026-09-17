import type { AuthenticatedUser } from '@/domain/entities/AuthenticatedUser';
import { Avatar } from '@/presentation/design-system/Avatar';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { formatCount } from '@/presentation/utils/formatCount';

interface ProfileHeroProps {
  user: AuthenticatedUser;
  /** Sobrepõe o avatar do GitHub (avatar local das preferências). */
  avatarUri?: string;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Box flexDirection="row" alignItems="baseline" gap="xs">
      <Text variant="h3">{value}</Text>
      <Text variant="caption">{label}</Text>
    </Box>
  );
}

export function ProfileHero({ user, avatarUri }: ProfileHeroProps) {
  return (
    <Box gap="md" alignItems="center">
      <Avatar uri={avatarUri ?? user.avatarUrl} login={user.login} size="xl" />

      <Box gap="xs" alignItems="center">
        <Text variant="h1">{user.name ?? user.login}</Text>
        <Text variant="body" color="fgMuted">
          @{user.login}
        </Text>
      </Box>

      {user.bio !== null && (
        <Text variant="body" style={{ textAlign: 'center' }}>
          {user.bio}
        </Text>
      )}

      <Box flexDirection="row" flexWrap="wrap" justifyContent="center" gap="lg" paddingTop="sm">
        <Stat value={String(user.publicReposCount)} label="repositórios" />
        <Stat value={formatCount(user.followers)} label="seguidores" />
        <Stat value={String(user.following)} label="seguindo" />
      </Box>
    </Box>
  );
}

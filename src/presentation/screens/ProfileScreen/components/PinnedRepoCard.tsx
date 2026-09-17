import { useTheme } from '@shopify/restyle';
import { GitFork, Pin, Star } from 'lucide-react-native';

import type { Repository } from '@/domain/entities/Repository';
import { Card } from '@/presentation/design-system/Card';
import { Box } from '@/presentation/design-system/primitives/Box';
import { LanguageDot } from '@/presentation/design-system/primitives/LanguageDot';
import { Text } from '@/presentation/design-system/primitives/Text';
import { formatCount } from '@/presentation/utils/formatCount';
import type { Theme } from 'src/infra/theme/lightTheme';

interface PinnedRepoCardProps {
  repo: Repository;
  onPress: () => void;
}

export function PinnedRepoCard({ repo, onPress }: PinnedRepoCardProps) {
  const theme = useTheme<Theme>();

  return (
    <Card variant="surface" onPress={onPress}>
      <Box gap="sm">
        <Box flexDirection="row" alignItems="center" gap="sm">
          <Pin size={14} color={theme.colors.fgSubtle} />
          <Text variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
            {repo.name}
          </Text>
        </Box>

        {repo.description !== null && (
          <Text variant="bodySmall" color="fgMuted" numberOfLines={2}>
            {repo.description}
          </Text>
        )}

        <Box flexDirection="row" alignItems="center" gap="lg">
          <LanguageDot language={repo.language} />
          <Box flexDirection="row" alignItems="center" gap="xs">
            <Star size={13} color={theme.colors.fgSubtle} />
            <Text variant="caption">{formatCount(repo.stars)}</Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap="xs">
            <GitFork size={13} color={theme.colors.fgSubtle} />
            <Text variant="caption">{formatCount(repo.forks)}</Text>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

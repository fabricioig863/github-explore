import { useTheme } from '@shopify/restyle';

import type { ContributionDay, ContributionLevel } from '@/domain/entities/ContributionDay';
import { Badge } from '@/presentation/design-system/Badge';
import { Card } from '@/presentation/design-system/Card';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { totalContributions } from '@/presentation/utils/contributions';
import type { Theme } from 'src/infra/theme/lightTheme';

interface ContributionsCardProps {
  days: ContributionDay[];
}

const LEVEL_ALPHA: Record<Exclude<ContributionLevel, 0>, string> = {
  1: '40',
  2: '80',
  3: 'bf',
  4: 'ff',
};

const CELL = 12;

export function ContributionsCard({ days }: ContributionsCardProps) {
  const theme = useTheme<Theme>();
  const total = totalContributions(days);

  const cellColor = (level: ContributionLevel): string =>
    level === 0 ? theme.colors.surfaceMuted : `${theme.colors.accent}${LEVEL_ALPHA[level]}`;

  return (
    <Card variant="surface">
      <Box gap="md">
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Box gap="xs">
            <Text variant="bodySmall" color="fgMuted">
              Contribuições
            </Text>
            <Text variant="h3">{total.toLocaleString('pt-BR')} no último ano</Text>
          </Box>
          <Badge tone="info">Em breve</Badge>
        </Box>

        <Box flexDirection="row" flexWrap="wrap" gap="xs">
          {days.map((day, i) => (
            <Box
              key={i}
              width={CELL}
              height={CELL}
              borderRadius="sm"
              style={{ backgroundColor: cellColor(day.level) }}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
}

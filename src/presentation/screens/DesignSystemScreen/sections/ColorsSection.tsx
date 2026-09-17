import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import type { Theme } from 'src/infra/theme/lightTheme';

import { ShowBlock } from '../components/ShowBlock';

// Tokens semânticos — reagem ao tema (não usamos hex cru).
const SWATCHES: (keyof Theme['colors'])[] = [
  'fg',
  'fgMuted',
  'accent',
  'success',
  'warning',
  'danger',
];

export function ColorsSection() {
  return (
    <ShowBlock title="Cores">
      <Box flexDirection="row" flexWrap="wrap" gap="md">
        {SWATCHES.map((token) => (
          <Box key={token} gap="xs" alignItems="center">
            <Box width={64} height={64} borderRadius="md" backgroundColor={token} />
            <Text variant="caption">{token}</Text>
          </Box>
        ))}
      </Box>
    </ShowBlock>
  );
}

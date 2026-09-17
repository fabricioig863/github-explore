import { Avatar } from '@/presentation/design-system/Avatar';
import { Button } from '@/presentation/design-system/Button';
import { Card } from '@/presentation/design-system/Card';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';

import { ShowBlock } from '../components/ShowBlock';

export function CardAvatarSection() {
  return (
    <ShowBlock title="Card · Avatar">
      <Card variant="surface">
        <Box flexDirection="row" alignItems="center" gap="md">
          <Avatar
            uri="https://avatars.githubusercontent.com/u/69631?v=4"
            login="facebook"
            size="md"
          />
          <Box flex={1} gap="xs" style={{ minWidth: 0 }}>
            <Text variant="h3">facebook</Text>
            <Text variant="caption" color="fgMuted">
              Organization · 2.1k repos
            </Text>
          </Box>
          <Button variant="outline" size="sm">
            Seguir
          </Button>
        </Box>
      </Card>
    </ShowBlock>
  );
}

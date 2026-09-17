import { Badge } from '@/presentation/design-system/Badge';
import { Box } from '@/presentation/design-system/primitives/Box';

import { ShowBlock } from '../components/ShowBlock';

export function BadgesSection() {
  return (
    <ShowBlock title="Badges">
      <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap="sm">
        <Badge tone="danger">danger</Badge>
        <Badge tone="warning">warning</Badge>
        <Badge tone="info">info</Badge>
        <Badge tone="success">success</Badge>
      </Box>
    </ShowBlock>
  );
}

import { Button } from '@/presentation/design-system/Button';
import { Box } from '@/presentation/design-system/primitives/Box';

import { ShowBlock } from '../components/ShowBlock';

export function ButtonsSection() {
  return (
    <ShowBlock title="Botões">
      <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap="sm">
        <Button variant="primary">Primary</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </Box>
      <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap="sm">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
        <Button disabled>disabled</Button>
        <Button loading>loading</Button>
      </Box>
    </ShowBlock>
  );
}

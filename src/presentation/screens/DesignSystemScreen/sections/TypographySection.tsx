import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';

import { ShowBlock } from '../components/ShowBlock';

export function TypographySection() {
  return (
    <ShowBlock title="Tipografia">
      <Box gap="sm">
        <Text variant="display">Display</Text>
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="body">Body — texto corrido padrão da interface.</Text>
        <Text variant="bodySmall">Body Small</Text>
        <Text variant="caption">Caption · auxiliar</Text>
        <Text variant="mono">console.log(&apos;mono&apos;)</Text>
        <Text variant="eyebrow">EYEBROW</Text>
      </Box>
    </ShowBlock>
  );
}

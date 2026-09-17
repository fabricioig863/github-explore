import type { ReactNode } from 'react';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';

interface ShowBlockProps {
  title: string;
  children: ReactNode;
}

export function ShowBlock({ title, children }: ShowBlockProps) {
  return (
    <Box gap="md">
      <Text variant="h3">{title}</Text>
      {children}
    </Box>
  );
}

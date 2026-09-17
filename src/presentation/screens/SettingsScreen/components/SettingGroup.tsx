import { Children, type ReactNode } from 'react';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';

interface SettingGroupProps {
  title?: string;
  children: ReactNode;
}

export function SettingGroup({ title, children }: SettingGroupProps) {
  const rows = Children.toArray(children);

  return (
    <Box gap="sm">
      {title !== undefined && (
        <Text variant="eyebrow" style={{ textTransform: 'uppercase' }}>
          {title}
        </Text>
      )}
      <Box backgroundColor="surface" borderRadius="xxl" borderWidth={1} borderColor="border">
        {rows.map((row, i) => (
          <Box key={i}>
            {i > 0 && <Box height={1} backgroundColor="border" marginLeft="huge" />}
            {row}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

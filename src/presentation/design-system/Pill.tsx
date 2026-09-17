import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { formatCount } from '@/presentation/utils/formatCount';
import type { Theme } from 'src/infra/theme/lightTheme';

type PillVariant = 'filter' | 'static';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: ReactNode;
  count?: number;
  variant?: PillVariant;
}

export function Pill({
  label,
  selected = false,
  onPress,
  leftIcon,
  count,
  variant = 'static',
}: PillProps) {
  const isSelectedFilter = variant === 'filter' && selected;
  const backgroundColor: keyof Theme['colors'] = isSelectedFilter ? 'fg' : 'surfaceMuted';
  const textColor: keyof Theme['colors'] = isSelectedFilter ? 'bg' : 'fg';

  const content = (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="xs"
      backgroundColor={backgroundColor}
      paddingHorizontal="lg"
      paddingVertical="sm"
      borderRadius="pill"
      alignSelf="flex-start"
    >
      {leftIcon}
      <Text variant="bodySmall" color={textColor}>
        {label}
        {count != null ? ` · ${formatCount(count)}` : ''}
      </Text>
    </Box>
  );

  if (onPress === undefined) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

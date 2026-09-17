import { useTheme } from '@shopify/restyle';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import type { Theme } from 'src/infra/theme/lightTheme';

interface SettingRowProps {
  icon: ReactNode;
  label: string;
  subtitle?: string;
  value?: string;
  labelColor?: keyof Theme['colors'];
  onPress?: () => void;
  showChevron?: boolean;
  trailing?: ReactNode;
}

export function SettingRow({
  icon,
  label,
  subtitle,
  value,
  labelColor = 'fg',
  onPress,
  showChevron = false,
  trailing,
}: SettingRowProps) {
  const theme = useTheme<Theme>();

  const content = (
    <Box flexDirection="row" alignItems="center" gap="md" padding="huge">
      {icon}
      <Box flex={1} gap="xs" style={{ minWidth: 0 }}>
        <Text variant="body" color={labelColor}>
          {label}
        </Text>
        {subtitle !== undefined && (
          <Text variant="caption" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </Box>

      {value !== undefined && (
        <Text variant="bodySmall" color="fgMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
          {value}
        </Text>
      )}
      {trailing}
      {showChevron && <ChevronRight size={18} color={theme.colors.fgSubtle} />}
    </Box>
  );

  if (onPress === undefined) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}

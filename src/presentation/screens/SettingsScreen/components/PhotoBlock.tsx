import { useTheme } from '@shopify/restyle';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Avatar } from '@/presentation/design-system/Avatar';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import type { Theme } from 'src/infra/theme/lightTheme';

interface PhotoBlockProps {
  avatarUri: string;
  login: string;
  onChange: () => void;
  onRemove: () => void;
  busy?: boolean;
}

function Action({
  icon,
  label,
  color,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: keyof Theme['colors'];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed || disabled ? 0.5 : 1 })}
    >
      <Box flexDirection="row" alignItems="center" gap="sm">
        {icon}
        <Text variant="bodySmall" color={color}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}

export function PhotoBlock({
  avatarUri,
  login,
  onChange,
  onRemove,
  busy = false,
}: PhotoBlockProps) {
  const theme = useTheme<Theme>();

  return (
    <Box alignItems="center" gap="md">
      <Box>
        <Avatar uri={avatarUri} login={login} size="xl" />
        <Box
          position="absolute"
          bottom={0}
          right={0}
          width={26}
          height={26}
          borderRadius="pill"
          backgroundColor="accent"
          alignItems="center"
          justifyContent="center"
          borderWidth={2}
          borderColor="bg"
        >
          <Camera size={13} color={theme.colors.accentText} />
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap="mega">
        <Action
          icon={<ImagePlus size={16} color={theme.colors.fg} />}
          label="Alterar foto"
          color="fg"
          onPress={onChange}
          disabled={busy}
        />
        <Action
          icon={<Trash2 size={16} color={theme.colors.danger} />}
          label="Remover"
          color="danger"
          onPress={onRemove}
          disabled={busy}
        />
      </Box>
    </Box>
  );
}

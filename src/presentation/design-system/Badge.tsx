import type { ReactNode } from 'react';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import type { Theme } from 'src/infra/theme/lightTheme';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dotColor?: string;
  /** Cor do label (#rrggbb) — quando definida, pinta fundo + texto no estilo GitHub. */
  color?: string;
}

const TONE_COLOR: Record<BadgeTone, keyof Theme['colors']> = {
  neutral: 'fgMuted',
  info: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function Badge({ children, tone = 'neutral', dotColor, color }: BadgeProps) {
  // Estilo "label colorido": fundo translúcido + borda + texto na cor do label.
  if (color !== undefined) {
    return (
      <Box
        paddingHorizontal="lg"
        paddingVertical="xs"
        borderRadius="pill"
        borderWidth={1}
        alignSelf="flex-start"
        style={{ backgroundColor: `${color}1f`, borderColor: `${color}59` }}
      >
        <Text variant="caption" style={{ color }}>
          {children}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="sm"
      paddingHorizontal="lg"
      paddingVertical="xs"
      borderRadius="pill"
      backgroundColor="surfaceMuted"
      alignSelf="flex-start"
    >
      {dotColor !== undefined ? (
        <Box width={6} height={6} borderRadius="pill" style={{ backgroundColor: dotColor }} />
      ) : (
        <Box width={6} height={6} borderRadius="pill" backgroundColor={TONE_COLOR[tone]} />
      )}
      <Text variant="caption" color="fgMuted">
        {children}
      </Text>
    </Box>
  );
}

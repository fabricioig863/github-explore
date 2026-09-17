import { useTheme } from '@shopify/restyle';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '@/presentation/components/ThemeToggleButton';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { useThemeMode } from 'src/infra/theme/AppThemeProvider';
import type { Theme } from 'src/infra/theme/lightTheme';

import { BadgesSection } from './sections/BadgesSection';
import { ButtonsSection } from './sections/ButtonsSection';
import { CardAvatarSection } from './sections/CardAvatarSection';
import { ColorsSection } from './sections/ColorsSection';
import { InputsSection } from './sections/InputsSection';
import { TypographySection } from './sections/TypographySection';

export function DesignSystemScreen() {
  const theme = useTheme<Theme>();
  const { resolvedScheme, setMode } = useThemeMode();
  const isDark = resolvedScheme === 'dark';

  return (
    <Box flex={1} backgroundColor="bg">
      <SafeAreaView edges={['top']}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="huge"
          paddingVertical="md"
        >
          <Text variant="h2">Design System</Text>
          <ThemeToggleButton isDark={isDark} onToggle={() => setMode(isDark ? 'light' : 'dark')} />
        </Box>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.huge, gap: theme.spacing.mega }}>
        <ButtonsSection />
        <InputsSection />
        <BadgesSection />
        <CardAvatarSection />
        <ColorsSection />
        <TypographySection />
      </ScrollView>
    </Box>
  );
}

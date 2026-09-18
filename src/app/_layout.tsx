import 'src/infra/reactotron/ReactotronConfig';

import { useTheme } from '@shopify/restyle';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Box } from '@/presentation/design-system/primitives/Box';
import { Spinner } from '@/presentation/design-system/primitives/Spinner';
import { useAuthSession } from '@/presentation/hooks/useAuthSession';
import { QueryProvider } from 'src/infra/query/QueryProvider';
import { AppThemeProvider } from 'src/infra/theme/AppThemeProvider';
import { useAppFonts } from 'src/infra/theme/fonts';
import type { Theme } from 'src/infra/theme/lightTheme';

void SplashScreen.preventAutoHideAsync();

function HydratingScreen() {
  return (
    <Box flex={1} backgroundColor="bg" alignItems="center" justifyContent="center">
      <Spinner size="large" />
    </Box>
  );
}

// Fica dentro dos providers porque useAuthSession consulta o React Query e lê
// o tema. Stack.Protected troca o grupo de rotas conforme a sessão: ao logar ou
// deslogar o expo-router remonta a árvore aplicando o crossfade.
function RootNavigation() {
  const theme = useTheme<Theme>();
  const { isAuthenticated, isHydrating } = useAuthSession();

  if (isHydrating) {
    return <HydratingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.colors.bg },
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.fg,
        headerTitleStyle: { fontFamily: 'Geist_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      {/* Fora dos blocos protegidos: o retorno do OAuth chega exatamente na
          transição entre deslogado e logado, e precisa existir nos dois lados. */}
      <Stack.Screen name="redirect" />

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="[owner]/[repo]/index"
          options={{ headerShown: true, title: 'Detalhes' }}
        />
        <Stack.Screen
          name="[owner]/[repo]/issues"
          options={{ headerShown: true, title: 'Issues' }}
        />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Configurações' }} />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontsError !== null) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && fontsError === null) {
    return null;
  }

  return (
    <QueryProvider>
      <AppThemeProvider>
        <RootNavigation />
        <StatusBar style="auto" />
      </AppThemeProvider>
    </QueryProvider>
  );
}

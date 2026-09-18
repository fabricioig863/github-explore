import 'src/infra/reactotron/ReactotronConfig';

import { useTheme } from '@shopify/restyle';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { QueryProvider } from 'src/infra/query/QueryProvider';
import { AppThemeProvider } from 'src/infra/theme/AppThemeProvider';
import { useAppFonts } from 'src/infra/theme/fonts';
import type { Theme } from 'src/infra/theme/lightTheme';

void SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const theme = useTheme<Theme>();

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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="[owner]/[repo]/index"
        options={{ headerShown: true, title: 'Detalhes' }}
      />
      <Stack.Screen name="[owner]/[repo]/issues" options={{ headerShown: true, title: 'Issues' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Configurações' }} />
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

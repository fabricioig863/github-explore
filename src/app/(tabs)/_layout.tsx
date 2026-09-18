import { useTheme } from '@shopify/restyle';
import { Tabs } from 'expo-router';
import { Bookmark, Compass, Component, User } from 'lucide-react-native';

import type { Theme } from 'src/infra/theme/lightTheme';

export default function TabsLayout() {
  const theme = useTheme<Theme>();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bg,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.fg,
        tabBarInactiveTintColor: theme.colors.fgSubtle,
        tabBarLabelStyle: { fontFamily: 'Geist_500Medium', fontSize: 11 },

        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.fg,
        headerTitleStyle: { fontFamily: 'Geist_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',

          headerShown: true,
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="design"
        options={{
          title: 'Design',
          tabBarIcon: ({ color }) => <Component size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Salvos',
          tabBarIcon: ({ color, focused }) => (
            <Bookmark size={22} color={color} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

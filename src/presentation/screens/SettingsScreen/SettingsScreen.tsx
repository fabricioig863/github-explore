import { useTheme } from '@shopify/restyle';
import { useQuery } from '@tanstack/react-query';
import { AtSign, GitBranch, IdCard, LogOut, Mail, Moon } from 'lucide-react-native';
import { ScrollView, Switch } from 'react-native';

import { EmptyState } from '@/presentation/components/EmptyState';
import { Badge } from '@/presentation/design-system/Badge';
import { Box } from '@/presentation/design-system/primitives/Box';
import { useAuthSession } from '@/presentation/hooks/useAuthSession';
import { useRemoveAvatar } from '@/presentation/hooks/useRemoveAvatar';
import { useSignOut } from '@/presentation/hooks/useSignOut';
import { useUpdateAvatar } from '@/presentation/hooks/useUpdateAvatar';
import { preferencesQueries } from '@/presentation/query/collections/preferencesQueries';
import { useThemeMode } from 'src/infra/theme/AppThemeProvider';
import type { Theme } from 'src/infra/theme/lightTheme';

import { PhotoBlock } from './components/PhotoBlock';
import { SettingGroup } from './components/SettingGroup';
import { SettingRow } from './components/SettingRow';

export function SettingsScreen() {
  const theme = useTheme<Theme>();
  const { session } = useAuthSession();
  const user = session?.user ?? null;

  const { data: prefs } = useQuery(preferencesQueries.user());
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();
  const signOut = useSignOut();
  const { resolvedScheme, setMode } = useThemeMode();

  if (user === null) {
    return (
      <Box flex={1} backgroundColor="bg">
        <EmptyState title="Sessão não encontrada" />
      </Box>
    );
  }

  const avatarUri = prefs?.localAvatarUri ?? user.avatarUrl;
  const isDark = resolvedScheme === 'dark';

  return (
    <ScrollView style={{ flex: 1 }}>
      <Box backgroundColor="bg" padding="huge" gap="mega">
        <PhotoBlock
          avatarUri={avatarUri}
          login={user.login}
          onChange={() => updateAvatar.mutate()}
          onRemove={() => removeAvatar.mutate()}
          busy={updateAvatar.isPending || removeAvatar.isPending}
        />

        <SettingGroup title="Conta">
          <SettingRow
            icon={<IdCard size={18} color={theme.colors.fg} />}
            label="Nome"
            value={user.name ?? '—'}
            showChevron
          />
          <SettingRow
            icon={<AtSign size={18} color={theme.colors.fg} />}
            label="Usuário"
            value={`@${user.login}`}
            showChevron
          />
          <SettingRow
            icon={<Mail size={18} color={theme.colors.fg} />}
            label="E-mail"
            value={user.email ?? '—'}
            showChevron
          />
        </SettingGroup>

        <SettingGroup title="Aparência">
          <SettingRow
            icon={<Moon size={18} color={theme.colors.accent} />}
            label="Tema escuro"
            subtitle="Reduz o brilho à noite"
            trailing={
              <Switch
                value={isDark}
                onValueChange={(next) => setMode(next ? 'dark' : 'light')}
                trackColor={{ false: theme.colors.borderStrong, true: theme.colors.accent }}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="Conexões">
          <SettingRow
            icon={<GitBranch size={18} color={theme.colors.fg} />}
            label="Conta GitHub"
            subtitle={user.email ?? user.login}
            trailing={<Badge tone="success">Conectada</Badge>}
          />
        </SettingGroup>

        <SettingGroup>
          <SettingRow
            icon={<LogOut size={18} color={theme.colors.danger} />}
            label="Sair da conta"
            labelColor="danger"
            onPress={() => signOut.mutate()}
          />
        </SettingGroup>
      </Box>
    </ScrollView>
  );
}

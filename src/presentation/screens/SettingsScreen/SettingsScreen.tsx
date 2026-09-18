import { useTheme } from '@shopify/restyle';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Moon, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Switch, TextInput } from 'react-native';

import { Badge } from '@/presentation/design-system/Badge';
import { Button } from '@/presentation/design-system/Button';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import {
  useAccessToken,
  useClearAccessToken,
  useSaveAccessToken,
} from '@/presentation/hooks/useAccessToken';
import { useRemoveAvatar } from '@/presentation/hooks/useRemoveAvatar';
import { useUpdateAvatar } from '@/presentation/hooks/useUpdateAvatar';
import { preferencesQueries } from '@/presentation/query/collections/preferencesQueries';
import { DEFAULT_PROFILE_LOGIN } from '@/presentation/utils/defaultProfile';
import { useThemeMode } from 'src/infra/theme/AppThemeProvider';
import type { Theme } from 'src/infra/theme/lightTheme';

import { PhotoBlock } from './components/PhotoBlock';
import { SettingGroup } from './components/SettingGroup';
import { SettingRow } from './components/SettingRow';

const AVATAR_FALLBACK = `https://github.com/${DEFAULT_PROFILE_LOGIN}.png`;

export function SettingsScreen() {
  const theme = useTheme<Theme>();

  const { data: prefs } = useQuery(preferencesQueries.user());
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();
  const { resolvedScheme, setMode } = useThemeMode();

  const { hasToken } = useAccessToken();
  const saveToken = useSaveAccessToken();
  const clearToken = useClearAccessToken();
  const [draftToken, setDraftToken] = useState('');

  const avatarUri = prefs?.localAvatarUri ?? AVATAR_FALLBACK;
  const isDark = resolvedScheme === 'dark';

  return (
    <ScrollView style={{ flex: 1 }}>
      <Box backgroundColor="bg" padding="huge" gap="mega">
        <PhotoBlock
          avatarUri={avatarUri}
          login={DEFAULT_PROFILE_LOGIN}
          onChange={() => updateAvatar.mutate()}
          onRemove={() => removeAvatar.mutate()}
          busy={updateAvatar.isPending || removeAvatar.isPending}
        />

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

        <SettingGroup title="Acesso à API do GitHub">
          <SettingRow
            icon={<KeyRound size={18} color={theme.colors.fg} />}
            label="Token de acesso"
            subtitle={
              hasToken
                ? 'Limite de 5.000 requisições por hora'
                : 'Anônimo · 60 requisições por hora'
            }
            trailing={
              <Badge tone={hasToken ? 'success' : 'neutral'}>
                {hasToken ? 'Configurado' : 'Opcional'}
              </Badge>
            }
          />

          <Box gap="md" paddingTop="md">
            <Text variant="caption" color="fgMuted">
              O app funciona sem token — toda a API usada aqui é pública. Um Personal Access Token
              só eleva o limite de requisições. Gere um em github.com/settings/tokens sem marcar
              nenhum escopo: acesso de leitura pública já basta.
            </Text>

            {hasToken ? (
              <Button
                variant="ghost"
                onPress={() => clearToken.mutate()}
                loading={clearToken.isPending}
                leftIcon={<Trash2 size={16} color={theme.colors.danger} />}
              >
                Remover token
              </Button>
            ) : (
              <>
                <TextInput
                  value={draftToken}
                  onChangeText={setDraftToken}
                  placeholder="ghp_… ou github_pat_…"
                  placeholderTextColor={theme.colors.fgSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  accessibilityLabel="Personal Access Token do GitHub"
                  style={{
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.lg,
                    borderRadius: theme.borderRadii.xl,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    color: theme.colors.fg,
                    fontFamily: 'GeistMono_400Regular',
                    fontSize: 14,
                  }}
                />
                <Button
                  onPress={() => {
                    saveToken.mutate(draftToken);
                    setDraftToken('');
                  }}
                  loading={saveToken.isPending}
                  disabled={draftToken.trim().length === 0}
                >
                  Salvar token
                </Button>
              </>
            )}

            <Text variant="caption" color="fgSubtle">
              Fica guardado no armazenamento seguro deste aparelho e nunca é enviado para lugar
              nenhum além da própria API do GitHub.
            </Text>
          </Box>
        </SettingGroup>
      </Box>
    </ScrollView>
  );
}

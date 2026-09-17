import { useTheme } from '@shopify/restyle';
import { GitBranch } from 'lucide-react-native';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthCanceledError } from '@/domain/errors/AuthError';
import { Box } from '@/presentation/design-system/primitives/Box';
import { Text } from '@/presentation/design-system/primitives/Text';
import { useSignInWithGithub } from '@/presentation/hooks/useSignInWithGithub';
import { getErrorMessage } from '@/presentation/utils/getErrorMessage';
import AuthIllustration from 'assets/octolens-auth-illustration.svg';
import type { Theme } from 'src/infra/theme/lightTheme';

import { GithubButton } from './components/GithubButton';

const ILLUSTRATION_WIDTH = 260;
const ILLUSTRATION_HEIGHT = (ILLUSTRATION_WIDTH * 260) / 320;

const TERMS_URL = 'https://octolens.app/termos';
const PRIVACY_URL = 'https://octolens.app/privacidade';

export function AuthScreen() {
  const theme = useTheme<Theme>();
  const signIn = useSignInWithGithub();

  // Cancelar não é erro de UI — só erros reais aparecem para o usuário.
  const visibleError =
    signIn.isError && !(signIn.error instanceof AuthCanceledError) ? signIn.error : null;

  return (
    <Box flex={1} backgroundColor="bg">
      <SafeAreaView style={{ flex: 1 }}>
        <Box
          flex={1}
          paddingHorizontal="mega"
          paddingVertical="giga"
          justifyContent="space-between"
        >
          <Box gap="huge" marginTop="giga">
            <Box
              width={56}
              height={56}
              borderRadius="lg"
              backgroundColor="fg"
              alignItems="center"
              justifyContent="center"
            >
              <GitBranch size={28} color={theme.colors.bg} />
            </Box>
            <Box gap="md">
              <Text variant="display">Bem-vindo ao Github Explorer</Text>
              <Text variant="body" color="fgMuted">
                Entre com sua conta do GitHub para explorar repositórios e issues.
              </Text>
            </Box>
          </Box>

          <Box alignItems="center">
            <AuthIllustration width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT} />
          </Box>

          <Box gap="md">
            <GithubButton
              onPress={() => signIn.mutate()}
              loading={signIn.isPending}
              disabled={!signIn.isReady}
            />
            {visibleError !== null ? (
              <Text variant="caption" color="danger" textAlign="center">
                {getErrorMessage(visibleError)}
              </Text>
            ) : null}
          </Box>

          <Text variant="caption" color="fgSubtle" textAlign="center">
            Ao continuar, você concorda com os{' '}
            <Text
              variant="caption"
              color="fgMuted"
              onPress={() => {
                void Linking.openURL(TERMS_URL);
              }}
            >
              Termos de Uso
            </Text>{' '}
            e a{' '}
            <Text
              variant="caption"
              color="fgMuted"
              onPress={() => {
                void Linking.openURL(PRIVACY_URL);
              }}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </Box>
      </SafeAreaView>
    </Box>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRedirectUri, useAuthRequest, type DiscoveryDocument } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { AuthCanceledError, AuthDeniedError } from '@/domain/errors/AuthError';
import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY: DiscoveryDocument = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

const SCOPES = ['read:user', 'user:email', 'public_repo'];

export function useSignInWithGithub() {
  const queryClient = useQueryClient();
  const redirectUri =
    process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI ??
    makeRedirectUri({ scheme: 'octolens', path: 'redirect' });

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? '',
      scopes: SCOPES,
      redirectUri,
      // Cliente confidencial: o client_secret vive no Worker, então PKCE é
      // desnecessário. Ligado, o GitHub exige code_verifier na troca (que o
      // proxy não envia) → invalid_grant.
      usePKCE: false,
    },
    DISCOVERY,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new AuthCanceledError();
      }
      if (result.type !== 'success') {
        throw new AuthDeniedError();
      }

      const code = result.params.code;
      if (typeof code !== 'string' || code.length === 0) {
        throw new AuthDeniedError(result.params.error_description);
      }

      return container.signInWithGithubUseCase.execute(code);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.session(), session);
    },
  });

  return { ...mutation, isReady: request !== null };
}

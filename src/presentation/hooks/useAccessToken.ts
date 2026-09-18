import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/presentation/query/queryKeys';
import * as accessTokenStorage from 'src/infra/auth/accessTokenStorage';

export function useAccessToken() {
  const query = useQuery({
    queryKey: queryKeys.accessToken(),
    queryFn: () => accessTokenStorage.getToken(),
    staleTime: Infinity,
  });

  return {
    token: query.data ?? null,
    hasToken: query.data != null && query.data.length > 0,
    isLoading: query.isLoading,
  };
}

export function useSaveAccessToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      await accessTokenStorage.setToken(token);
      return token.trim();
    },
    onSuccess: (token) => {
      queryClient.setQueryData(queryKeys.accessToken(), token);

      void queryClient.invalidateQueries();
    },
  });
}

export function useClearAccessToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accessTokenStorage.clearToken(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.accessToken(), null);
      void queryClient.invalidateQueries();
    },
  });
}

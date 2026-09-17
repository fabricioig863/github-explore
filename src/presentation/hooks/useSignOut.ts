import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => container.signOutUseCase.execute(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedRepos() });
    },
  });
}

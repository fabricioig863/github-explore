import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => container.updateUserPreferencesUseCase.execute({ localAvatarUri: null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.prefs.user() });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { queryKeys } from '@/presentation/query/queryKeys';
import { container } from 'src/infra/di/bootstrap';

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled) return null;

      const uri = result.assets[0]?.uri;
      if (uri === undefined) return null;

      return container.updateUserPreferencesUseCase.execute({ localAvatarUri: uri });
    },
    onSuccess: (prefs) => {
      if (prefs !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.prefs.user() });
      }
    },
  });
}

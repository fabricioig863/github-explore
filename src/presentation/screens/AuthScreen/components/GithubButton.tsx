import { useTheme } from '@shopify/restyle';
import { GitBranch } from 'lucide-react-native';

import { Button } from '@/presentation/design-system/Button';
import type { Theme } from 'src/infra/theme/lightTheme';

interface GithubButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GithubButton({ onPress, loading = false, disabled = false }: GithubButtonProps) {
  const theme = useTheme<Theme>();

  return (
    <Button
      variant="primary"
      size="lg"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      leftIcon={<GitBranch size={20} color={theme.colors.bg} />}
    >
      Continuar com GitHub
    </Button>
  );
}

import { useTheme } from '@shopify/restyle';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { Box } from '@/presentation/design-system/primitives/Box';
import type { Theme } from 'src/infra/theme/lightTheme';

interface ProfileSearchProps {
  value: string;
  onSubmit: (login: string) => void;
}

export function ProfileSearch({ value, onSubmit }: ProfileSearchProps) {
  const theme = useTheme<Theme>();

  const [draft, setDraft] = useState(value);

  const submit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0) onSubmit(trimmed);
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="md"
      paddingHorizontal="lg"
      borderRadius="xl"
      backgroundColor="surface"
      borderColor="border"
      borderWidth={1}
    >
      <Search size={18} color={theme.colors.fgSubtle} />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={submit}
        placeholder="Buscar usuário do GitHub"
        placeholderTextColor={theme.colors.fgSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar usuário do GitHub"
        style={{
          flex: 1,
          paddingVertical: theme.spacing.lg,
          color: theme.colors.fg,
          fontFamily: 'Geist_400Regular',
          fontSize: 15,
        }}
      />
    </Box>
  );
}

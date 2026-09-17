import { useTheme } from '@shopify/restyle';
import { ScrollView } from 'react-native';

import { Pill } from '@/presentation/design-system/Pill';
import type { Theme } from 'src/infra/theme/lightTheme';

import type { PillDef } from '../explorePills';

interface PillRowProps {
  pills: readonly PillDef[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PillRow({ pills, selectedId, onSelect }: PillRowProps) {
  const theme = useTheme<Theme>();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.xxxl,
        gap: theme.spacing.sm,
      }}
    >
      {pills.map((pill) => {
        const selected = pill.id === selectedId;
        const iconColor = selected ? theme.colors.bg : theme.colors.fg;
        return (
          <Pill
            key={pill.id}
            variant="filter"
            label={pill.label}
            selected={selected}
            onPress={() => onSelect(pill.id)}
            leftIcon={pill.Icon ? <pill.Icon size={14} color={iconColor} /> : undefined}
          />
        );
      })}
    </ScrollView>
  );
}

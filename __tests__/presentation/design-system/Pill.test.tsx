import { Star } from 'lucide-react-native';

import { Pill } from '@/presentation/design-system/Pill';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

describe('Pill', () => {
  it('renderiza o label', () => {
    const { getByText } = renderWithProviders(<Pill label="Trending" />);
    expect(getByText('Trending')).toBeTruthy();
  });

  it('anexa a contagem formatada após o label', () => {
    const { getByText } = renderWithProviders(<Pill label="Abertas" count={8900} />);
    expect(getByText('Abertas · 8.9k')).toBeTruthy();
  });

  it('sem count não mostra o separador', () => {
    const { getByText } = renderWithProviders(<Pill label="Mobile" />);
    expect(getByText('Mobile')).toBeTruthy();
  });

  it('filtro selecionado (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill label="Rust" variant="filter" selected onPress={() => {}} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('filtro não-selecionado (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill label="Rust" variant="filter" selected={false} onPress={() => {}} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('com leftIcon e count (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill label="Trending" variant="filter" selected count={1500} leftIcon={<Star size={14} />} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

import { Star } from 'lucide-react-native';

import { Pill } from '@/presentation/design-system/Pill';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

describe('Pill', () => {
  it('renders the label', () => {
    const { getByText } = renderWithProviders(<Pill label="Trending" />);
    expect(getByText('Trending')).toBeTruthy();
  });

  it('appends the formatted count after the label', () => {
    const { getByText } = renderWithProviders(<Pill label="Abertas" count={8900} />);
    expect(getByText('Abertas · 8.9k')).toBeTruthy();
  });

  it('hides the separator when there is no count', () => {
    const { getByText } = renderWithProviders(<Pill label="Mobile" />);
    expect(getByText('Mobile')).toBeTruthy();
  });

  it('filtro selecionado (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill label="Rust" variant="filter" selected onPress={() => {}} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('unselected filter (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill label="Rust" variant="filter" selected={false} onPress={() => {}} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('with leftIcon and count (snapshot)', () => {
    const { toJSON } = renderWithProviders(
      <Pill
        label="Trending"
        variant="filter"
        selected
        count={1500}
        leftIcon={<Star size={14} />}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

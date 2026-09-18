import { ContributionsCard } from '@/presentation/screens/ProfileScreen/components/ContributionsCard';
import { generatePlaceholderContributions } from '@/presentation/utils/contributions';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

describe('ContributionsCard', () => {
  it('renders the total and the "Em breve" badge without hitting the network', () => {
    const days = generatePlaceholderContributions('octocat');
    const { getByText } = renderWithProviders(<ContributionsCard days={days} />);

    expect(getByText(/no último ano/)).toBeTruthy();
    expect(getByText('Em breve')).toBeTruthy();
  });
});

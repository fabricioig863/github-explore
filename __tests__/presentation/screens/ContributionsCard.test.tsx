import { ContributionsCard } from '@/presentation/screens/ProfileScreen/components/ContributionsCard';
import { generatePlaceholderContributions } from '@/presentation/utils/contributions';

import { renderWithProviders } from '../../test-utils/renderWithProviders';

describe('ContributionsCard', () => {
  it('renderiza total e o selo "Em breve" sem acessar rede', () => {
    const days = generatePlaceholderContributions('octocat');
    const { getByText } = renderWithProviders(<ContributionsCard days={days} />);

    expect(getByText(/no último ano/)).toBeTruthy();
    expect(getByText('Em breve')).toBeTruthy();
  });
});

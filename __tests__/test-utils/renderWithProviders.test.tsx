import { Text } from 'react-native';

import { createTestQueryClient, renderWithProviders } from './renderWithProviders';

function Probe() {
  return <Text>probe</Text>;
}

describe('renderWithProviders / createTestQueryClient', () => {
  it('creates a fresh QueryClient per call, sharing no reference', () => {
    const a = createTestQueryClient();
    const b = createTestQueryClient();
    expect(a).not.toBe(b);
  });

  it('does not leak data between two independent renders', () => {
    const clientA = createTestQueryClient();
    const clientB = createTestQueryClient();

    renderWithProviders(<Probe />, { queryClient: clientA });
    renderWithProviders(<Probe />, { queryClient: clientB });

    clientA.setQueryData(['shared-key'], { from: 'A' });

    expect(clientA.getQueryData(['shared-key'])).toEqual({ from: 'A' });
    expect(clientB.getQueryData(['shared-key'])).toBeUndefined();
  });

  it('renderWithProviders builds its own isolated client when none is given', () => {
    const external = createTestQueryClient();
    external.setQueryData(['external-key'], { from: 'external' });

    renderWithProviders(<Probe />);

    expect(external.getQueryData(['external-key'])).toEqual({ from: 'external' });
  });
});

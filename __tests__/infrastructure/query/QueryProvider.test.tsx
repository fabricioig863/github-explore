import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { QueryProvider } from 'src/infra/query/QueryProvider';

let seen: QueryClient[] = [];

function ClientProbe() {
  const client = useQueryClient();
  seen.push(client);
  return <Text testID="probe-client">{client instanceof QueryClient ? 'ok' : 'faltando'}</Text>;
}

describe('QueryProvider', () => {
  beforeEach(() => {
    seen = [];
  });

  it('expõe um QueryClient para os filhos via contexto', () => {
    render(
      <QueryProvider>
        <ClientProbe />
      </QueryProvider>,
    );

    expect(screen.getByTestId('probe-client').props.children).toBe('ok');
  });

  it('mantém o mesmo client entre re-renders', () => {
    const { rerender } = render(
      <QueryProvider>
        <ClientProbe />
      </QueryProvider>,
    );

    rerender(
      <QueryProvider>
        <ClientProbe />
      </QueryProvider>,
    );

    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });

  it('aplica os defaults configurados', () => {
    render(
      <QueryProvider>
        <ClientProbe />
      </QueryProvider>,
    );

    const client = seen[0];
    expect(client?.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
    expect(client?.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});

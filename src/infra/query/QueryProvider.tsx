import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { container } from 'src/infra/di/bootstrap';
import { createQueryClient } from 'src/infra/query/queryClient';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(() => createQueryClient(container.crashReporter));

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

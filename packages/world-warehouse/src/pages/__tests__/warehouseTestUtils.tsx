import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@spaceos/portal-ui';

/**
 * Közös wrapper a warehouse UI-tesztekhez (productionTestUtils-minta): friss
 * QueryClient (retry nélkül — a 400/404/409/410 azonnal hibaágra fut) +
 * ToastProvider (a képernyők toast-olnak) + router.
 */
export function createWarehouseWrapper(initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function WarehouseTestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  };
}

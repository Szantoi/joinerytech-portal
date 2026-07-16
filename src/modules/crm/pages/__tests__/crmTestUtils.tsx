import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../../components/ui'

/**
 * Közös wrapper a CRM UI-tesztekhez (az EHS ehsTestUtils mintája): friss
 * QueryClient (retry nélkül — a 409/404 azonnal hibaágra fut) + ToastProvider
 * (a mutáció-hookok toast-olnak) + router.
 */
export function createCrmWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function CrmTestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  }
}

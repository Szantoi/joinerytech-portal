import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../../components/ui'

/**
 * Közös wrapper a Kontrolling UI-tesztekhez (a crmTestUtils mintája): friss
 * QueryClient (retry nélkül — a 400/404 azonnal hibaágra fut) + ToastProvider
 * (a mutáció-hookok toast-olnak) + router.
 */
export function createControllingWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function ControllingTestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  }
}

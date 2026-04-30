/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// useAuth is mocked globally in test-setup.ts via vi.mock('./auth/AuthContext')

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: TestWrapper, ...options })
}

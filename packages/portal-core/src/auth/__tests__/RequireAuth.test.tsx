import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RequireAuth } from '../RequireAuth'
import type { AuthContextValue } from '../AuthContext'

const AUTH_BASE = {
  tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  roles: ['Admin'] as string[],
  enabledModules: ['door', 'cutting'] as string[],
  facilityId: '5716546d-94d9-4b4b-ad79-2a1afc79e730',
  facilityName: 'Vác főüzem',
}

// Override the global auth mock with a controllable vi.fn()
const mockUseAuth = vi.fn<() => AuthContextValue>(() => ({
  user: null,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'mock-token',
  ...AUTH_BASE,
}))

vi.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      {ui}
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: 'mock-token',
      ...AUTH_BASE,
    })
    renderWithRouter(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )
    expect(screen.getByText('Protected Content')).toBeTruthy()
  })

  it('shows loading state when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      ...AUTH_BASE,
    })
    renderWithRouter(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )
    expect(screen.getByText('Betöltés...')).toBeTruthy()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      token: null,
      ...AUTH_BASE,
    })
    renderWithRouter(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )
    expect(screen.queryByText('Protected Content')).toBeNull()
  })
})

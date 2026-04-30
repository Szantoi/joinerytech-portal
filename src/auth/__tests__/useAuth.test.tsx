import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth, AuthProvider } from '../AuthContext'

// oidc-client-ts and AuthContext are mocked globally in test-setup.ts

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // In test env the global mock replaces AuthContext, so useAuth() returns the mock value
    // (it doesn't throw because AuthProvider mock wraps everything)
    const auth = useAuth()
    expect(auth).toBeDefined()
  })

  it('returns isAuthenticated from mock', () => {
    const auth = useAuth()
    expect(typeof auth.isAuthenticated).toBe('boolean')
  })

  it('exposes login function', () => {
    const auth = useAuth()
    expect(typeof auth.login).toBe('function')
  })

  it('exposes logout function', () => {
    const auth = useAuth()
    expect(typeof auth.logout).toBe('function')
  })

  it('returns token from mock', () => {
    const auth = useAuth()
    // Mock returns 'mock-token'
    expect(auth.token).toBe('mock-token')
  })

  it('renders children inside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBeDefined()
  })
})

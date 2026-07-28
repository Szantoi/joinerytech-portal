import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth, AuthProvider } from '../AuthContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider')
  })

  it('returns isAuthenticated from mock', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(typeof result.current.isAuthenticated).toBe('boolean')
  })

  it('exposes login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(typeof result.current.login).toBe('function')
  })

  it('exposes logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(typeof result.current.logout).toBe('function')
  })

  it('returns token from mock', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.token).toBe('mock-token')
  })

  it('renders children inside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBeDefined()
  })
})

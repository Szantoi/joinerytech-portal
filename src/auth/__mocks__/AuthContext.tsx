/* eslint-disable react-refresh/only-export-components */
import { vi } from 'vitest'
import React from 'react'

export const useAuth = vi.fn(() => ({
  user: { profile: { preferred_username: 'test-user' } },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'mock-token-xyz',
}))

export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

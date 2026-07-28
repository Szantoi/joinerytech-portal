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
  tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  roles: ['Admin'],
  enabledModules: ['door', 'cutting'],
  facilityId: '5716546d-94d9-4b4b-ad79-2a1afc79e730',
  facilityName: 'Vác főüzem',
}))

export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const userManager = {
  signinRedirectCallback: vi.fn().mockResolvedValue({}),
  signinRedirect: vi.fn(),
  signoutRedirect: vi.fn(),
  getUser: vi.fn().mockResolvedValue(null),
  events: {
    addUserLoaded: vi.fn(),
    addUserUnloaded: vi.fn(),
    removeUserLoaded: vi.fn(),
    removeUserUnloaded: vi.fn(),
  },
}

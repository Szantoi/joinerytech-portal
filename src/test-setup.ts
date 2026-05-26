import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock oidc-client-ts globally — prevents heavy crypto/browser-only imports in jsdom
vi.mock('oidc-client-ts', () => {
  class MockUserManager {
    getUser = vi.fn().mockResolvedValue(null)
    signinRedirect = vi.fn()
    signoutRedirect = vi.fn()
    signinRedirectCallback = vi.fn().mockRejectedValue(new Error('no oidc code'))
    events = {
      addUserLoaded: vi.fn(),
      addUserUnloaded: vi.fn(),
      removeUserLoaded: vi.fn(),
      removeUserUnloaded: vi.fn(),
    }
  }
  class MockInMemoryWebStorage {
    private store: Record<string, string> = {}
    getItem(key: string) { return this.store[key] ?? null }
    setItem(key: string, value: string) { this.store[key] = value }
    removeItem(key: string) { delete this.store[key] }
    get length() { return Object.keys(this.store).length }
    key(index: number) { return Object.keys(this.store)[index] ?? null }
    clear() { this.store = {} }
  }
  class MockWebStorageStateStore {
    async set() {}
    async get() { return null }
    async remove() { return null }
    async getAllKeys() { return [] }
  }
  return {
    UserManager: MockUserManager,
    InMemoryWebStorage: MockInMemoryWebStorage,
    WebStorageStateStore: MockWebStorageStateStore,
    User: class {},
  }
})

// Global mock for auth context — isAuthenticated: true so RequireAuth passes in router tests
vi.mock('./auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-token',
    tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    roles: ['Admin'],
    enabledModules: ['door', 'cutting'],
    facilityId: '5716546d-94d9-4b4b-ad79-2a1afc79e730',
    facilityName: 'Vác főüzem',
  }),
  AuthProvider: ({ children }: { children: unknown }) => children,
  userManager: {
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
  },
}))

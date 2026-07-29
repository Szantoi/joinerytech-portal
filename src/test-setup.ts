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
vi.mock('@spaceos/portal-core', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAuth: () => ({
    user: null,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-token',
    tenantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    // Admin + üzemvezető: a router-suite minden világot bejár, és az
    // ütemezés-képernyő kiosztási ága is működő állapotban legyen.
    roles: ['Admin', 'production_manager'],
    // The shared router suite exercises every product world. Keep this as the
    // full-development tenant entitlement seed; restricted tenants are covered
    // explicitly in RequireAuth/worldAccess tests.
    enabledModules: [
      'spaceos.crm',
      'spaceos.controlling',
      'spaceos.hr',
      'spaceos.maintenance',
      'spaceos.qa',
      'spaceos.ehs',
      'spaceos.dms',
      'joinerytech.cutting',
      'joinerytech.joinery',
      'joinerytech.inventory',
      'joinerytech.procurement',
    ],
    facilityId: '5716546d-94d9-4b4b-ad79-2a1afc79e730',
    facilityName: 'Vác főüzem',
  }),
  AuthProvider: ({ children }: { children: unknown }) => children,
  // A valódi RequireAuth a modul-BELSŐ useAuth-ot hívja (a mock a csomag-exportot
  // cseréli, a belső hivatkozást nem éri el) → itt passthrough kell.
  RequireAuth: ({ children }: { children: unknown }) => children,
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

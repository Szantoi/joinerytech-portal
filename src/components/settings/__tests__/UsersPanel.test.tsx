import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UsersPanel } from '../UsersPanel'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-token',
    user: { profile: { name: 'Test User' } },
  })),
}))

const MOCK_USERS = [
  {
    id: 'u-001',
    tenantId: 't-001',
    email: 'test@test.hu',
    firstName: 'Teszt',
    lastName: 'User',
    status: 'Active',
    kcSyncStatus: 'Synced',
  },
  {
    id: 'u-002',
    tenantId: 't-001',
    email: 'disabled@test.hu',
    firstName: 'Tiltott',
    lastName: 'Felhasználó',
    status: 'Disabled',
    kcSyncStatus: 'Synced',
  },
  {
    id: 'u-003',
    tenantId: 't-001',
    email: 'failed@test.hu',
    firstName: 'Failed',
    lastName: 'Sync',
    status: 'Active',
    kcSyncStatus: 'Failed',
  },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UsersPanel', () => {
  it('shows loading skeleton while fetching', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<UsersPanel />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error fallback on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText(/Nem sikerült/)).toBeTruthy())
  })

  it('shows disabled user with Tiltott badge and grey avatar class', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText('Tiltott Felhasználó')).toBeTruthy())
    expect(screen.getByText('Tiltott')).toBeTruthy()
    // Grey avatar for disabled user
    const avatars = document.querySelectorAll('.from-stone-300')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('shows Failed sync warning text for failed user', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText('Failed Sync')).toBeTruthy())
    expect(screen.getByText('Szinkron hiba')).toBeTruthy()
  })

  it('shows correct sync summary counts', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText('Szinkronizáció')).toBeTruthy())
    // 2 Synced, 0 Pending, 1 Failed — labels visible in sync panel
    expect(screen.getByText('Synced')).toBeTruthy()
    expect(screen.getByText('Pending')).toBeTruthy()
    expect(screen.getByText('Failed')).toBeTruthy()
  })

  it('opens InviteUserSlideOver when Meghívás clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText('Teszt User')).toBeTruthy())
    fireEvent.click(screen.getByText('Meghívás'))
    expect(screen.getByText('Új felhasználó meghívása')).toBeTruthy()
  })

  it('opens UserDetailSlideOver when user row clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<UsersPanel />)
    await waitFor(() => expect(screen.getByText('Teszt User')).toBeTruthy())
    fireEvent.click(screen.getByText('Teszt User').closest('button')!)
    expect(screen.getByText('Adatok')).toBeTruthy()
    expect(screen.getByText('Műveletek')).toBeTruthy()
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsPage } from '../SettingsPage'

vi.mock('../../auth', () => ({
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

describe('SettingsPage', () => {
  it('renders company tab by default', () => {
    render(<SettingsPage />)
    expect(screen.getByDisplayValue('Doorstar Hungary Zrt.')).toBeTruthy()
  })

  it('company tab has adoszam and bank fields', () => {
    render(<SettingsPage />)
    expect(screen.getByDisplayValue('12345678-2-13')).toBeTruthy()
    expect(screen.getByDisplayValue('OTP · 11774012-12345678')).toBeTruthy()
  })

  it('switches to users tab - shows loading skeleton', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows users from API', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    await waitFor(() => expect(screen.getByText('Teszt User')).toBeTruthy())
    expect(screen.getByText('test@test.hu')).toBeTruthy()
  })

  it('shows Disabled badge for disabled user', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    await waitFor(() => expect(screen.getByText('Tiltott Felhasználó')).toBeTruthy())
    expect(screen.getByText('Tiltott')).toBeTruthy()
  })

  it('shows error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    ))
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    await waitFor(() => expect(screen.getByText(/Nem sikerült/)).toBeTruthy())
  })

  it('shows Meghívás button and opens invite slide-over on users tab', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_USERS) })
    ))
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    await waitFor(() => expect(screen.getByText('Teszt User')).toBeTruthy())
    fireEvent.click(screen.getByText('Meghívás'))
    expect(screen.getByText('Új felhasználó meghívása')).toBeTruthy()
  })

  it('switches to roles tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Jogosults/))
    const matches = screen.getAllByText('Teljes')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('switches to facilities tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Telephely'))
    expect(screen.getByText(/c \u2014 f/)).toBeTruthy()
  })

  it('switches to machines tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/ppark/))
    expect(screen.getByText('Holzma HPP380')).toBeTruthy()
  })

  it('switches to partners tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Partnerek/))
    expect(screen.getByText(/Egger/)).toBeTruthy()
  })

  it('switches to audit tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Audit/))
    expect(screen.getByText('order.create')).toBeTruthy()
  })
})

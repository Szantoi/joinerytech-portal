import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewPODrawer } from '../NewPODrawer'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    token: 'mock',
    user: { profile: { name: 'Test User' } },
  })),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDrawer(open = true) {
  return render(
    <NewPODrawer open={open} onClose={vi.fn()} onCreated={vi.fn()} />
  )
}

describe('NewPODrawer', () => {
  it('renders title', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByText('Új megrendelés')).toBeTruthy())
  })

  it('renders supplier dropdown', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByText('Szállító *')).toBeTruthy())
    // Fallback suppliers should be in the dropdown
    expect(screen.getByText('Egger Faipari Kft.')).toBeTruthy()
  })

  it('renders material input', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByPlaceholderText('pl. Tölgy bútorlap 22mm')).toBeTruthy())
  })

  it('renders quantity and unit fields', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByText('Mennyiség *')).toBeTruthy())
    expect(screen.getByText('Egység')).toBeTruthy()
  })

  it('shows validation error when submitting without supplier', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => screen.getByText('Megrendelés →'))
    fireEvent.click(screen.getByText('Megrendelés →'))
    await waitFor(() => {
      const errors = screen.getAllByText('Kötelező mező')
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  it('shows date validation error on submit without date', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => screen.getByText('Megrendelés →'))
    fireEvent.click(screen.getByText('Megrendelés →'))
    await waitFor(() => expect(screen.getAllByText('Kötelező mező').length).toBeGreaterThan(0))
  })

  it('renders Mégse button', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByText('Mégse')).toBeTruthy())
  })

  it('renders note textarea', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer()
    await waitFor(() => expect(screen.getByPlaceholderText('Belső megjegyzés (opcionális)')).toBeTruthy())
  })

  it('does not render when open=false', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 })))
    renderDrawer(false)
    expect(screen.queryByText('Új megrendelés')).toBeNull()
  })
})

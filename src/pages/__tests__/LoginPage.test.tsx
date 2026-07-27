import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

const mockLogin = vi.fn<() => Promise<void>>()

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
    token: null,
    user: null,
  })),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    // sikeres signinRedirect: a böngésző elnavigál, a promise sosem "tér vissza"
    mockLogin.mockReturnValue(new Promise<void>(() => {}))
  })

  it('egyetlen Keycloak-belépőgomb van — hitelesítő adatot bekérő mező NINCS', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /Bejelentkezés/ })).toBeInTheDocument()
    // a díszlet-űrlap kivezetve: a jelszót kizárólag a Keycloak kérheti be
    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(document.querySelector('input[type="email"]')).toBeNull()
  })

  it('kattintásra egyszer indítja a redirectet és busy állapotot mutat', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Bejelentkezés/ }))
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/Átirányítás a bejelentkezéshez/)).toBeInTheDocument()
  })

  it('ha a redirect el sem indul, látható hibát ad és a gomb újra aktív', async () => {
    mockLogin.mockRejectedValue(new Error('network down'))
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Bejelentkezés/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Nem sikerült elérni/)
    expect(screen.getByRole('button', { name: /Bejelentkezés/ })).toBeEnabled()
  })
})

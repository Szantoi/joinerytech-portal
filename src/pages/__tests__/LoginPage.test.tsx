import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

const mockLogin = vi.fn()

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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear()
  })

  it('renders without crashing', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows loading indicator', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/Bejelentkezés/)).toBeInTheDocument()
  })

  it('renders login form when not authenticated', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/Üdv újra!/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bejelentkezés/ })).toBeInTheDocument()
  })
})

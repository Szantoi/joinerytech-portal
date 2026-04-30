import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

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
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear()
    mockNavigate.mockClear()
  })

  it('renders without crashing', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows brand name', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getAllByText(/joinery/i).length).toBeGreaterThan(0)
  })

  it('shows Üdv újra heading', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('Üdv újra!')).toBeInTheDocument()
  })

  it('shows email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Jelszó')).toBeInTheDocument()
  })

  it('shows Google and SSO buttons', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('SSO / Microsoft')).toBeInTheDocument()
  })

  it('calls login on form submit', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Bejelentkezés'))
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('calls login on Google button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Google'))
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('switches to SSO mode', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('SSO / Microsoft'))
    expect(screen.getByText('SSO bejelentkezés')).toBeInTheDocument()
  })

  it('switches to forgot mode', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Elfelejtetted?'))
    expect(screen.getByText('Jelszó visszaállítása')).toBeInTheDocument()
  })

  it('shows sent confirmation after forgot submit', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Elfelejtetted?'))
    fireEvent.click(screen.getByText('Link küldése'))
    expect(screen.getByText(/Visszaállító link elküldve/)).toBeInTheDocument()
  })

  it('shows shopfloor hint', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/Shop Floor/)).toBeInTheDocument()
  })

  it('shows footer copyright', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/JoineryTech Kft/)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '../LandingPage'

// useAuth mock
vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: null,
    user: null,
  })),
}))

// useNavigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('LandingPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders without crashing', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows the brand name', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getAllByText(/joinery/i).length).toBeGreaterThan(0)
  })

  it('shows the hero headline', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getByText(/digitális platformja/i)).toBeInTheDocument()
  })

  it('shows login button', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('shows all 4 feature blocks', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getByText('Megrendelések')).toBeInTheDocument()
    expect(screen.getByText('Gyártásirányítás')).toBeInTheDocument()
    expect(screen.getByText('Lapszabászat')).toBeInTheDocument()
    expect(screen.getByText('Raktár & Beszerzés')).toBeInTheDocument()
  })

  it('shows footer', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getByText(/joinerytech\.hu/i)).toBeInTheDocument()
  })
})

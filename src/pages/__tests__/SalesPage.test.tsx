import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SalesWorldPage } from '../SalesPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock',
    user: { profile: { name: 'Test User' } },
  })),
}))

function renderSales(screen = '') {
  const path = screen ? `/w/sales/${screen}` : '/w/sales'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/w/sales" element={<SalesWorldPage />} />
        <Route path="/w/sales/:screen" element={<SalesWorldPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SalesPage', () => {
  it('renders title', () => {
    renderSales()
    const matches = screen.getAllByText(/rtékesít/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders pipeline stage headers', () => {
    renderSales()
    expect(screen.getByText('Vázlat')).toBeTruthy()
  })

  it('switches to quotes tab', () => {
    renderSales('quotes')
    expect(screen.getByText(/Azonos/)).toBeTruthy()
  })

  it('switches to customers tab', () => {
    renderSales('customers')
    const ltvs = screen.getAllByText('LTV')
    expect(ltvs.length).toBeGreaterThan(0)
  })

  it('shows rejected filter in quotes', () => {
    renderSales('quotes')
    expect(screen.getAllByText('Elutasítva').length).toBeGreaterThan(0)
  })

  it('shows Új ajánlat button in quotes', () => {
    renderSales('quotes')
    expect(screen.getByText('Új ajánlat')).toBeTruthy()
  })

  it('shows orders screen', () => {
    renderSales('orders')
    expect(screen.getByText('Rendelésszám')).toBeTruthy()
  })
})

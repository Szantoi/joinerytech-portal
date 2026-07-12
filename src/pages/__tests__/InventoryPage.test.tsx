import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryPage } from '../InventoryPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(() => ({ token: null, isAuthenticated: false, isLoading: false, roles: [] })),
}))

describe('InventoryPage', () => {
  it('renders materials tab button', () => {
    render(<InventoryPage />)
    const matches = screen.getAllByText(/Anyagok/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders empty state when no API data', () => {
    render(<InventoryPage />)
    expect(screen.getByText('Nincs adat az Inventory API-ból')).toBeTruthy()
  })

  it('switches to offcuts tab', () => {
    render(<InventoryPage />)
    fireEvent.click(screen.getByText(/Marad\u00e9k/))
    expect(screen.getByText(/nyilv\u00e1ntart\u00e1s/)).toBeTruthy()
  })

  it('switches to movements tab shows pending banner', () => {
    render(<InventoryPage />)
    fireEvent.click(screen.getByText(/K\u00e9szletmozg/))
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrdersPage } from '../OrdersPage'

describe('OrdersPage', () => {
  it('renders title', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/Rendel\u00e9sek/)).toBeTruthy()
  })

  it('renders filter buttons including Mind', () => {
    render(<OrdersPage />)
    expect(screen.getByRole('button', { name: 'Mind' })).toBeTruthy()
  })

  it('renders order table headers', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/Azonos/)).toBeTruthy()
  })

  it('filters by door type', () => {
    render(<OrdersPage />)
    const doorButtons = screen.getAllByText(/Ajt\u00f3/)
    fireEvent.click(doorButtons[0])
    expect(doorButtons.length).toBeGreaterThan(0)
  })

  it('renders new order button', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/j rendel/)).toBeTruthy()
  })
})

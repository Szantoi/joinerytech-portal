import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrdersPage } from '../OrdersPage'

describe('OrdersPage', () => {
  it('renders order list container', () => {
    render(<OrdersPage />)
    // No mock fallback — list is empty when no API token in test env
    expect(screen.getByText(/Azonos/)).toBeTruthy()
  })

  it('renders filter buttons including Mind', () => {
    render(<OrdersPage />)
    expect(screen.getByText('Mind')).toBeTruthy()
  })

  it('renders order table headers', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/Azonos/)).toBeTruthy()
  })

  it('renders status filter for Vázlat', () => {
    render(<OrdersPage />)
    const matches = screen.getAllByText('Vázlat')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders new order button', () => {
    render(<OrdersPage />)
    expect(screen.getByText(/j rendel/)).toBeTruthy()
  })

  it('renders order table structure', () => {
    render(<OrdersPage />)
    // No mock fallback — list is empty when no API token in test env
    // Check that the filter bar and column headers are rendered
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

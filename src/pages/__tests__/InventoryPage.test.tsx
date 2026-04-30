import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryPage } from '../InventoryPage'

describe('InventoryPage', () => {
  it('renders title', () => {
    render(<InventoryPage />)
    const matches = screen.getAllByText(/K\u00e9szlet/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders materials table in default tab', () => {
    render(<InventoryPage />)
    expect(screen.getByText('Anyag')).toBeTruthy()
  })

  it('switches to offcuts tab', () => {
    render(<InventoryPage />)
    fireEvent.click(screen.getByText(/Marad\u00e9k/))
    expect(screen.getByText(/nyilv\u00e1ntart\u00e1s/)).toBeTruthy()
  })

  it('switches to movements tab', () => {
    render(<InventoryPage />)
    fireEvent.click(screen.getByText(/K\u00e9szletmozg/))
    expect(screen.getByText(/Anyagmozg/)).toBeTruthy()
  })
})

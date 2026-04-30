import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SalesPage } from '../SalesPage'

describe('SalesPage', () => {
  it('renders title', () => {
    render(<SalesPage />)
    const matches = screen.getAllByText(/rt\u00e9kes\u00edt/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders pipeline stage headers', () => {
    render(<SalesPage />)
    expect(screen.getByText('Vázlat')).toBeTruthy()
  })

  it('switches to quotes tab', () => {
    render(<SalesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajánlatok' }))
    expect(screen.getByText(/Azonos/)).toBeTruthy()
  })

  it('switches to customers tab', () => {
    render(<SalesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ügyfelek' }))
    const ltvs = screen.getAllByText('LTV')
    expect(ltvs.length).toBeGreaterThan(0)
  })
})

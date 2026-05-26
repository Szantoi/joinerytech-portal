import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcurementPage } from '../ProcurementPage'

describe('ProcurementPage', () => {
  it('renders suppliers section', () => {
    render(<ProcurementPage />)
    expect(screen.getByText('Sz\u00e1ll\u00edt\u00f3k')).toBeTruthy()
  })

  it('renders active POs', () => {
    render(<ProcurementPage />)
    expect(screen.getByText('Akt\u00edv megrendel\u00e9sek')).toBeTruthy()
  })

  it('renders new PO button', () => {
    render(<ProcurementPage />)
    expect(screen.getByText('\u00daj megrendel\u00e9s')).toBeTruthy()
  })

  it('renders PO table headers', () => {
    render(<ProcurementPage />)
    expect(screen.getByText('Sz\u00e1ll\u00edt\u00f3')).toBeTruthy()
    expect(screen.getByText('\u00d6sszeg')).toBeTruthy()
  })

  it('renders supplier ratings', () => {
    render(<ProcurementPage />)
    const eggerMatches = screen.getAllByText(/Egger/)
    expect(eggerMatches.length).toBeGreaterThan(0)
    const stars = screen.getAllByText(/★/)
    expect(stars.length).toBeGreaterThan(0)
  })
})

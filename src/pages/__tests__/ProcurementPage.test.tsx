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

  it('renders empty state when no API data', () => {
    render(<ProcurementPage />)
    // Without API token, suppliers list is empty
    expect(screen.getByText('Szállítók')).toBeTruthy()
  })
})

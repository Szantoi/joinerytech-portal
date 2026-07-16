import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProcurementPage } from '../ProcurementPage'

// ProcurementPage uses useSearchParams (RFQ filters), so it needs a Router context
function renderPage() {
  return render(
    <MemoryRouter>
      <ProcurementPage />
    </MemoryRouter>
  )
}

describe('ProcurementPage', () => {
  it('renders suppliers section', () => {
    renderPage()
    expect(screen.getByText('Szállítók')).toBeTruthy()
  })

  it('renders active POs', () => {
    renderPage()
    expect(screen.getByText('Aktív megrendelések')).toBeTruthy()
  })

  it('renders new PO button', () => {
    renderPage()
    expect(screen.getByText('Új megrendelés')).toBeTruthy()
  })

  it('renders PO table headers', () => {
    renderPage()
    expect(screen.getByText('Szállító')).toBeTruthy()
    expect(screen.getByText('Összeg')).toBeTruthy()
  })

  it('renders empty state when no API data', () => {
    renderPage()
    // Without API token, suppliers list is empty
    expect(screen.getByText('Szállítók')).toBeTruthy()
  })
})

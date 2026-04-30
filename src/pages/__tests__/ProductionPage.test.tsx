import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductionPage } from '../ProductionPage'

describe('ProductionPage', () => {
  it('renders cutting plans tab by default', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders cutting plans in default tab', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders nesting SVG', () => {
    const { container } = render(<ProductionPage />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('switches to machining tab and shows columns', () => {
    render(<ProductionPage />)
    fireEvent.click(screen.getByText(/Megmunk/))
    const cncMatches = screen.getAllByText(/CNC/)
    expect(cncMatches.length).toBeGreaterThan(0)
  })

  it('renders plan selector with progress for running plan', () => {
    render(<ProductionPage />)
    expect(screen.getByText('CP-184-A')).toBeTruthy()
  })
})

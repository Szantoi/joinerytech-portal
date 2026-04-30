import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductionPage } from '../ProductionPage'

describe('ProductionPage', () => {
  it('renders title', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/Gy\u00e1rt\u00e1s/)).toBeTruthy()
  })

  it('renders cutting plans in default tab', () => {
    render(<ProductionPage />)
    expect(screen.getByText(/g\u00f3terv/)).toBeTruthy()
  })

  it('renders nesting SVG', () => {
    const { container } = render(<ProductionPage />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('switches to machining tab', () => {
    render(<ProductionPage />)
    fireEvent.click(screen.getByText(/Megmunk/))
    expect(screen.getByText(/CNC/)).toBeTruthy()
  })
})

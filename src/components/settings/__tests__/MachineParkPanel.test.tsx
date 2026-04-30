import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MachineParkPanel } from '../MachineParkPanel'

describe('MachineParkPanel', () => {
  it('renders machine names', () => {
    render(<MachineParkPanel />)
    expect(screen.getByText('Holzma HPP380')).toBeTruthy()
  })

  it('renders machine count', () => {
    render(<MachineParkPanel />)
    const els = screen.getAllByText(/gép/)
    expect(els.length).toBeGreaterThan(0)
  })

  it('renders add machine button', () => {
    render(<MachineParkPanel />)
    expect(screen.getByText('Gép hozzáadása')).toBeTruthy()
  })
})

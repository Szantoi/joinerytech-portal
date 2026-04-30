import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OffcutsPanel } from '../OffcutsPanel'

describe('OffcutsPanel', () => {
  it('renders summary cards', () => {
    render(<OffcutsPanel />)
    expect(screen.getByText('Raktárban')).toBeTruthy()
    expect(screen.getByText('Felhasználható')).toBeTruthy()
    expect(screen.getByText('Sérült')).toBeTruthy()
  })

  it('renders offcut IDs', () => {
    render(<OffcutsPanel />)
    expect(screen.getByText('OC-007')).toBeTruthy()
  })

  it('renders nyilvántartás header', () => {
    render(<OffcutsPanel />)
    expect(screen.getByText(/nyilv/)).toBeTruthy()
  })
})

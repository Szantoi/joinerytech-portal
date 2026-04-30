import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RolesPanel } from '../RolesPanel'

describe('RolesPanel', () => {
  it('renders permission matrix title', () => {
    render(<RolesPanel />)
    expect(screen.getByText('Jogosultsági mátrix')).toBeTruthy()
  })

  it('renders role keys', () => {
    render(<RolesPanel />)
    expect(screen.getByText('Admin')).toBeTruthy()
  })

  it('renders permission levels', () => {
    render(<RolesPanel />)
    const fullCells = screen.getAllByText('Teljes')
    expect(fullCells.length).toBeGreaterThan(0)
  })
})

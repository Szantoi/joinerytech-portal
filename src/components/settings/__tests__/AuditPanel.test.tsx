import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuditPanel } from '../AuditPanel'

describe('AuditPanel', () => {
  it('renders audit log entries', () => {
    render(<AuditPanel />)
    expect(screen.getByText('order.create')).toBeTruthy()
  })

  it('renders hash chain info', () => {
    render(<AuditPanel />)
    expect(screen.getByText(/hash chain/)).toBeTruthy()
  })

  it('renders export buttons', () => {
    render(<AuditPanel />)
    expect(screen.getByText(/CSV/)).toBeTruthy()
  })
})

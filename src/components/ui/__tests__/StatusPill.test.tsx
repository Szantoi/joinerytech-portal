import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill, STATUS_TONES } from '../StatusPill'

describe('StatusPill', () => {
  it('renders label text', () => {
    render(<StatusPill status="draft" label="Piszkozat" />)
    expect(screen.getByText('Piszkozat')).toBeTruthy()
  })

  it('applies correct tone classes for running', () => {
    const { container } = render(<StatusPill status="running" label="Futó" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-teal-50')
  })

  it('falls back to draft tone for unknown status', () => {
    const { container } = render(<StatusPill status="unknown" label="?" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-stone-100')
  })

  it('shows dot indicator', () => {
    const { container } = render(<StatusPill status="critical" label="Kritikus" />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toBeTruthy()
  })
})

describe('STATUS_TONES', () => {
  it('has all expected statuses', () => {
    const keys = ['draft', 'calc', 'ready', 'released', 'planned', 'running', 'done', 'low', 'ok', 'critical']
    keys.forEach((k) => {
      expect(STATUS_TONES[k]).toBeDefined()
      expect(STATUS_TONES[k].bg).toBeDefined()
      expect(STATUS_TONES[k].fg).toBeDefined()
      expect(STATUS_TONES[k].dot).toBeDefined()
    })
  })
})

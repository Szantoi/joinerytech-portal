import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill, STATUS_TONES } from '../StatusPill'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})

describe('StatusPill', () => {
  it('renders label text (label mindig látható — spec 2.5)', () => {
    render(<StatusPill tone="neutral" label="Piszkozat" />)
    expect(screen.getByText('Piszkozat')).toBeTruthy()
  })

  it('közvetlen tone prop alkalmazza a tónus-osztályokat (light+dark)', () => {
    const { container } = render(<StatusPill tone="progress" label="Futó" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-teal-100')
    expect(span.className).toContain('dark:bg-teal-950')
  })

  it('fsm + status: FSM_TONES-ból oldja fel a tónust (alias is)', () => {
    const { container } = render(
      <StatusPill fsm="ehsBaleset" status="reported" label="Bejelentve" />,
    )
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-rose-100') // bejelentve → danger
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('legacy status kulcs továbbra is működik', () => {
    const { container } = render(<StatusPill status="running" label="Futó" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-teal-100') // running → progress
  })

  it('ismeretlen status → neutral tónus + dev-warning', () => {
    const { container } = render(<StatusPill status="unknown" label="?" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('bg-stone-100')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('dot dekoratív (aria-hidden), terminal tónusnál üreges', () => {
    const { container } = render(<StatusPill tone="terminal" label="Lezárva" />)
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot).toBeTruthy()
    expect(dot.className).toContain('bg-transparent')
    expect(dot.className).toContain('border')
  })

  it('size="sm" kompakt osztályokat ad', () => {
    const { container } = render(<StatusPill tone="info" label="Info" size="sm" />)
    const span = container.firstElementChild as HTMLElement
    expect(span.className).toContain('h-5')
  })
})

describe('STATUS_TONES (kompat re-export)', () => {
  it('a 7 szemantikus tónust exportálja bg/fg/dot stílussal', () => {
    const keys = ['neutral', 'info', 'progress', 'success', 'warn', 'danger', 'terminal'] as const
    keys.forEach((k) => {
      expect(STATUS_TONES[k]).toBeDefined()
      expect(STATUS_TONES[k].bg).toBeDefined()
      expect(STATUS_TONES[k].fg).toBeDefined()
      expect(STATUS_TONES[k].dot).toBeDefined()
    })
  })
})

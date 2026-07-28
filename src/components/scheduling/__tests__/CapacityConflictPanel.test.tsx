import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { CapacityConflictPanel } from '../CapacityConflictPanel'
import type { CapacityLoadReport } from '../../../lib/scheduling/capacityLoadModel'

const report: CapacityLoadReport = {
  weekStart: '2026-08-03',
  hoursPerDay: 8,
  stations: [
    {
      station: 'Szabászat',
      cells: [
        { day: 0, hours: 4, taskCount: 2 },
        { day: 1, hours: 9.25, taskCount: 6 },
      ],
      totalHours: 13.25,
      utilizationPct: 118,
    },
    {
      station: 'Megmunkálás',
      cells: [{ day: 0, hours: 2, taskCount: 1 }],
      totalHours: 2,
      utilizationPct: 25,
    },
  ],
  bottlenecks: ['Szabászat — kedd (9.3 ó / 8 ó)'],
}

describe('CapacityConflictPanel', () => {
  it('renders the grid with the Hungarian frame', () => {
    render(<CapacityConflictPanel report={report} />)
    expect(screen.getByRole('heading', { name: 'Részlegek terhelése' })).toBeTruthy()
    expect(screen.getByText('Kapacitás: 8.0 ó / nap / részleg')).toBeTruthy()
    expect(screen.getByRole('table', { name: 'Részlegek heti terhelése' })).toBeTruthy()
    expect(screen.getByText('4.0 ó')).toBeTruthy()
    expect(screen.getByText('9.3 ó')).toBeTruthy()
  })

  it('shows the legend built from the same threshold rule as the grid', () => {
    const { container } = render(<CapacityConflictPanel report={report} />)
    expect(screen.getByText('rendben')).toBeTruthy()
    expect(screen.getByText('75% felett')).toBeTruthy()
    expect(screen.getByText('túlterhelt')).toBeTruthy()
    const dots = [...container.querySelectorAll('li span[aria-hidden="true"]')].map((el) => el.getAttribute('class') ?? '')
    expect(dots[0]).toContain('bg-emerald-500')
    expect(dots[1]).toContain('bg-amber-500')
    expect(dots[2]).toContain('bg-rose-500')
  })

  it('lists the bottlenecks in a labelled section', () => {
    render(<CapacityConflictPanel report={report} />)
    const section = screen.getByRole('region', { name: 'Szűk keresztmetszetek ezen a héten' })
    expect(within(section).getByText('Szabászat — kedd (9.3 ó / 8 ó)')).toBeTruthy()
  })

  it('hides the bottleneck section when there is none', () => {
    render(<CapacityConflictPanel report={{ ...report, bottlenecks: [] }} />)
    expect(screen.queryByRole('region', { name: 'Szűk keresztmetszetek ezen a héten' })).toBeNull()
  })

  it('shows the empty state instead of a grid for an invalid week', () => {
    render(<CapacityConflictPanel report={{ ...report, weekStart: 'not-a-date' }} />)
    expect(screen.getByRole('status').textContent).toBe('Nincs megjeleníthető terhelés-adat.')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('does not carry the Doorstar capacity editor over', () => {
    const { container } = render(<CapacityConflictPanel report={report} />)
    expect(container.querySelector('input')).toBeNull()
  })

  it('paints without a single inline style (tone system only)', () => {
    const { container } = render(<CapacityConflictPanel report={report} />)
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('steps the days over a DST change without skipping one', () => {
    // 2026-10-25 az óraátállítás vasárnapja (CET): az a nap 25 órás.
    render(<CapacityConflictPanel report={{ ...report, weekStart: '2026-10-19' }} />)
    // A nap-nevet az Intl adja (a nagybetűs megjelenítés CSS), a dátumot a
    // naptári léptetés — 19-től 25-ig, kihagyás és ismétlés nélkül.
    const dates = screen
      .getAllByRole('columnheader')
      .slice(1, 8)
      .map((th) => th.textContent?.replace(/^\D+/, ''))
    expect(dates).toEqual(['10.19.', '10.20.', '10.21.', '10.22.', '10.23.', '10.24.', '10.25.'])
  })
})

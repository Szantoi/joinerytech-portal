import { describe, it, expect } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { GanttChart, type GanttLane } from '../GanttChart'

const DAY = '2026-08-03T00:00:00Z'
const DAY_MS = Date.parse(DAY)

const lanes: GanttLane[] = [
  {
    id: 'saw',
    label: 'Szabász',
    items: [
      { id: 'a', label: 'A tétel', start: '2026-08-03T06:00:00Z', end: '2026-08-03T08:00:00Z', tone: 'info' },
      { id: 'bad', label: 'Hibás', start: 'not-a-date', end: '2026-08-03T09:00:00Z' },
      { id: 'reversed', label: 'Fordított', start: '2026-08-03T10:00:00Z', end: '2026-08-03T09:00:00Z' },
    ],
  },
  { id: 'cnc', label: 'CNC', items: [{ id: 'b', label: 'B tétel', start: DAY_MS + 3600_000, end: DAY_MS + 7200_000 }] },
]

function renderChart(props: Partial<ComponentProps<typeof GanttChart>> = {}) {
  return render(
    <GanttChart lanes={lanes} ariaLabel="Idősáv" emptyLabel="Nincs megjeleníthető sáv" {...props} />,
  )
}

describe('GanttChart', () => {
  it('exposes an accessible graphic with the lane labels', () => {
    renderChart()
    expect(screen.getByRole('img', { name: 'Idősáv' })).toBeTruthy()
    expect(screen.getByText('Szabász')).toBeTruthy()
    expect(screen.getByText('CNC')).toBeTruthy()
  })

  it('drops invalid intervals instead of drawing a misleading bar', () => {
    const { container } = renderChart()
    expect(container.querySelectorAll('rect[rx="3"]')).toHaveLength(2)
    expect(screen.queryByText('Hibás')).toBeNull()
    expect(screen.queryByText('Fordított')).toBeNull()
  })

  it('renders the empty label when there is no lane at all', () => {
    render(<GanttChart lanes={[]} ariaLabel="Idősáv" emptyLabel="Nincs megjeleníthető sáv" />)
    expect(screen.getByRole('status').textContent).toBe('Nincs megjeleníthető sáv')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders lane rows without bars when the lanes are empty', () => {
    render(
      <GanttChart
        lanes={[{ id: 'saw', label: 'Szabász', items: [] }]}
        ariaLabel="Idősáv"
        emptyLabel="Nincs megjeleníthető sáv"
      />,
    )
    expect(screen.getByText('Szabász')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('draws an explicit tick list on a fixed domain (time axis header)', () => {
    renderChart({
      domain: { start: DAY_MS, end: DAY_MS + 24 * 3600_000 },
      ticks: [
        { value: DAY_MS, label: '0:00' },
        { value: DAY_MS + 12 * 3600_000, label: '12:00' },
        { value: DAY_MS + 23 * 3600_000, label: '23:00' },
      ],
    })
    expect(screen.getByText('0:00')).toBeTruthy()
    expect(screen.getByText('12:00')).toBeTruthy()
    expect(screen.getByText('23:00')).toBeTruthy()
  })

  it('draws a grid line but no label for an empty tick label', () => {
    const { container } = renderChart({
      domain: { start: DAY_MS, end: DAY_MS + 24 * 3600_000 },
      ticks: [
        { value: DAY_MS, label: '0:00' },
        { value: DAY_MS + 3600_000, label: '' },
        { value: DAY_MS + 2 * 3600_000, label: '' },
      ],
    })
    expect(container.querySelectorAll('line[stroke-dasharray="3 4"]')).toHaveLength(3)
    expect(screen.getAllByText(/:00$/)).toHaveLength(1)
  })

  it('derives the domain from the items and formats ticks with the injected formatter', () => {
    // Érvényes intervallumok: 01:00–02:00 és 06:00–08:00 → a tartomány 01:00–08:00.
    renderChart({ ticks: 2, formatTick: (value) => `#${new Date(value).getUTCHours()}` })
    expect(screen.getByText('#1')).toBeTruthy()
    expect(screen.getByText('#8')).toBeTruthy()
  })

  it('scales with a responsive viewBox instead of a fixed pixel size', () => {
    const { container } = renderChart({ plotWidth: 600, laneLabelWidth: 100, rowHeight: 40 })
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 700 108')
    expect(svg?.getAttribute('width')).toBeNull()
    expect(svg?.getAttribute('class')).toContain('w-full')
  })

  it('colors bars from the tone system, never from a hardcoded value', () => {
    const { container } = renderChart()
    const bar = container.querySelector('rect[rx="3"]')
    expect(bar?.getAttribute('class')).toContain('fill-sky-100')
    expect(bar?.getAttribute('fill')).toBeNull()
    expect(container.querySelector('[style]')).toBeNull()
  })
})

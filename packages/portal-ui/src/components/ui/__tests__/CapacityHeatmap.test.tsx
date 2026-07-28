import { describe, it, expect } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen, within } from '@testing-library/react'
import { CapacityHeatmap } from '../CapacityHeatmap'
import { capacityTone } from '../capacityHeatmap.types'
import type { CapacityBucket, CapacityRow } from '../capacityHeatmap.types'

const buckets: CapacityBucket[] = [
  { id: 'mon', label: 'H', detail: '8.3.' },
  { id: 'tue', label: 'K', detail: '8.4.', highlighted: true },
  { id: 'wed', label: 'Sze', detail: '8.5.' },
]

const rows: CapacityRow[] = [
  {
    id: 'saw',
    label: 'Szabászat',
    cells: [
      { bucketId: 'mon', value: 4, detail: '2 feladat' },
      { bucketId: 'tue', value: 7, detail: '5 feladat' },
      { bucketId: 'wed', value: 9, detail: '7 feladat' },
    ],
    summary: { label: '20.0 ó', ratio: 0.83, ratioLabel: '83%' },
  },
  {
    id: 'cnc',
    label: 'Megmunkálás',
    // A szerdai vödörre nincs adat — a cella üresen marad, nem nullázódik.
    cells: [{ bucketId: 'mon', value: 2, detail: '1 feladat' }],
    summary: { label: '2.0 ó', ratio: 0.08, ratioLabel: '8%' },
  },
]

function renderHeatmap(props: Partial<ComponentProps<typeof CapacityHeatmap>> = {}) {
  return render(
    <CapacityHeatmap
      buckets={buckets}
      rows={rows}
      capacity={8}
      formatValue={(value) => `${value.toFixed(1)} ó`}
      ariaLabel="Heti terhelés"
      emptyLabel="Nincs adat"
      rowHeaderLabel="Részleg"
      summaryHeaderLabel="Heti kihasználtság"
      {...props}
    />,
  )
}

describe('capacityTone', () => {
  it('maps load ratio onto the ok / warn / over tones', () => {
    expect(capacityTone(0.5)).toBe('success')
    expect(capacityTone(0.75)).toBe('success') // a küszöb FELETT vált, nem rajta
    expect(capacityTone(0.76)).toBe('warn')
    expect(capacityTone(1)).toBe('warn')
    expect(capacityTone(1.01)).toBe('danger')
  })

  it('honours custom thresholds', () => {
    expect(capacityTone(0.6, { warn: 0.5, over: 0.9 })).toBe('warn')
    expect(capacityTone(0.95, { warn: 0.5, over: 0.9 })).toBe('danger')
  })
})

describe('CapacityHeatmap', () => {
  it('uses real table semantics with row and column headers', () => {
    renderHeatmap()
    const table = screen.getByRole('table', { name: 'Heti terhelés' })
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Részleg',
      'H8.3.',
      'K8.4.',
      'Sze8.5.',
      'Heti kihasználtság',
    ])
    expect(within(table).getAllByRole('rowheader').map((th) => th.textContent)).toEqual([
      'Szabászat',
      'Megmunkálás',
    ])
  })

  it('paints the cells from the threshold tones', () => {
    const { container } = renderHeatmap()
    const firstRow = container.querySelectorAll('tbody tr')[0]
    const classes = [...firstRow.querySelectorAll('td')].map((td) => td.getAttribute('class') ?? '')
    expect(classes[0]).toContain('bg-emerald-100') // 4/8 = 50% → ok
    expect(classes[1]).toContain('bg-amber-100') //  7/8 = 88% → warn
    expect(classes[2]).toContain('bg-rose-100') //   9/8 = 113% → over
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('keeps the value and the detail as text, so tone is not the only signal', () => {
    renderHeatmap()
    expect(screen.getByText('9.0 ó')).toBeTruthy()
    expect(screen.getByText('7 feladat')).toBeTruthy()
  })

  it('leaves a missing bucket cell empty instead of inventing a zero', () => {
    const { container } = renderHeatmap()
    const secondRow = container.querySelectorAll('tbody tr')[1]
    const cells = [...secondRow.querySelectorAll('td')]
    expect(cells[1].textContent).toBe('')
    expect(cells[2].textContent).toBe('')
    expect(cells[1].getAttribute('class')).not.toContain('bg-emerald')
  })

  it('renders the utilization bar with an accessible label', () => {
    renderHeatmap()
    expect(screen.getByRole('img', { name: 'Szabászat: 83%' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Megmunkálás: 8%' })).toBeTruthy()
  })

  it('hides the summary column when no header is given', () => {
    renderHeatmap({ summaryHeaderLabel: undefined })
    expect(screen.queryByText('Heti kihasználtság')).toBeNull()
    expect(screen.queryByRole('img', { name: 'Szabászat: 83%' })).toBeNull()
  })

  it('keeps a 44px touch target on the cells', () => {
    const { container } = renderHeatmap()
    const cellBody = container.querySelector('tbody td div')
    expect(cellBody?.getAttribute('class')).toContain('min-h-[44px]')
  })

  it('renders the empty label without a table', () => {
    renderHeatmap({ rows: [] })
    expect(screen.getByRole('status').textContent).toBe('Nincs adat')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('does not divide by zero when the capacity is missing', () => {
    const { container } = renderHeatmap({ capacity: 0 })
    const firstCell = container.querySelector('tbody td')
    expect(firstCell?.getAttribute('class')).toContain('bg-rose-100') // 4/1 → túlterhelt, nem NaN
  })
})

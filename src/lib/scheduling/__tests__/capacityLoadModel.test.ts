import { describe, expect, it } from 'vitest'
import {
  buildCapacityBuckets,
  buildCapacityRows,
  DEFAULT_CAPACITY_LABELS,
  type CapacityLoadReport,
} from '../capacityLoadModel'

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
  ],
  bottlenecks: ['Szabászat — kedd'],
}

describe('capacity load view model', () => {
  it('builds one bucket per day of the week', () => {
    const buckets = buildCapacityBuckets(report.weekStart)
    expect(buckets).toHaveLength(7)
    expect(buckets[0]?.id).toBe('0')
    expect(buckets[0]?.detail).toBe('8.3.')
    expect(buckets[6]?.detail).toBe('8.9.')
  })

  it('takes the day names from Intl, not from a hand-written table', () => {
    const buckets = buildCapacityBuckets(report.weekStart)
    const monday = new Intl.DateTimeFormat('hu-HU', { weekday: 'short' }).format(new Date('2026-08-03T00:00:00'))
    expect(buckets[0]?.label).toBe(monday)
  })

  it('highlights only the given day', () => {
    const buckets = buildCapacityBuckets(report.weekStart, { today: new Date('2026-08-05T13:20:00') })
    expect(buckets.filter((bucket) => bucket.highlighted).map((bucket) => bucket.id)).toEqual(['2'])
  })

  it('leaves every bucket unhighlighted when no day is given', () => {
    expect(buildCapacityBuckets(report.weekStart).some((bucket) => bucket.highlighted)).toBe(false)
  })

  it('returns no bucket for an invalid week start', () => {
    expect(buildCapacityBuckets('not-a-date')).toEqual([])
  })

  it('maps station rows onto the heatmap props with the summary', () => {
    const [row] = buildCapacityRows(report)
    expect(row.id).toBe('Szabászat')
    expect(row.cells).toEqual([
      { bucketId: '0', value: 4, detail: '2 feladat' },
      { bucketId: '1', value: 9.25, detail: '6 feladat' },
    ])
    expect(row.summary).toEqual({ label: '13.3 ó', ratio: 1.18, ratioLabel: '118%' })
  })

  it('takes every wording from formatter props (no baked-in language)', () => {
    const [row] = buildCapacityRows(report, {
      ...DEFAULT_CAPACITY_LABELS,
      formatHours: (hours) => `${hours}h`,
      formatTaskCount: (count) => `${count} jobs`,
      formatUtilization: (percent) => `${percent} pct`,
    })
    expect(row.cells[0]?.detail).toBe('2 jobs')
    expect(row.summary?.label).toBe('13.25h')
    expect(row.summary?.ratioLabel).toBe('118 pct')
  })
})

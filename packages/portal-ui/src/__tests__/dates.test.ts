import { describe, it, expect } from 'vitest'
import {
  addDays,
  formatDateRange,
  formatDayName,
  isoDate,
  isSameDay,
  parseIsoDate,
  startOfDay,
  startOfWeek,
} from '../dates'

describe('date helpers', () => {
  it('formats a local ISO date (not the UTC-shifted one)', () => {
    // 23:30 helyi idő: a toISOString itt már a következő napot adná pozitív zónában.
    expect(isoDate(new Date(2026, 7, 3, 23, 30))).toBe('2026-08-03')
  })

  it('steps calendar days, not milliseconds', () => {
    // 2026-10-25 az óraátállítás vasárnapja CET-ben (25 órás nap).
    expect(isoDate(addDays(new Date(2026, 9, 24), 1))).toBe('2026-10-25')
    expect(isoDate(addDays(new Date(2026, 9, 25), 1))).toBe('2026-10-26')
    expect(isoDate(addDays(new Date(2026, 9, 25), -1))).toBe('2026-10-24')
  })

  it('steps across a month and a year boundary', () => {
    expect(isoDate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01')
    expect(isoDate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01')
  })

  it('snaps to the week start (Monday by default, Sunday on request)', () => {
    const wednesday = new Date(2026, 7, 5)
    expect(isoDate(startOfWeek(wednesday))).toBe('2026-08-03')
    expect(isoDate(startOfWeek(wednesday, 0))).toBe('2026-08-02')
    // Már a hét első napján állva nem lép vissza egy hetet.
    expect(isoDate(startOfWeek(new Date(2026, 7, 3)))).toBe('2026-08-03')
  })

  it('normalises to local midnight and compares by calendar day', () => {
    expect(startOfDay(new Date(2026, 7, 3, 18, 45)).getHours()).toBe(0)
    expect(isSameDay(new Date(2026, 7, 3, 0, 1), new Date(2026, 7, 3, 23, 59))).toBe(true)
    expect(isSameDay(new Date(2026, 7, 3), new Date(2026, 7, 4))).toBe(false)
  })

  it('parses an ISO date and rejects an invalid one', () => {
    expect(isoDate(parseIsoDate('2026-08-03') as Date)).toBe('2026-08-03')
    expect(parseIsoDate('not-a-date')).toBeUndefined()
  })

  it('takes day names from Intl for the given locale', () => {
    const monday = new Date(2026, 7, 3)
    expect(formatDayName(monday, 'hu-HU')).toBe(
      new Intl.DateTimeFormat('hu-HU', { weekday: 'short' }).format(monday),
    )
    expect(formatDayName(monday, 'en-US')).toBe('Mon')
    expect(formatDayName(monday, 'en-US', 'long')).toBe('Monday')
  })

  it('formats a date range with Intl', () => {
    const label = formatDateRange(new Date(2026, 7, 3), new Date(2026, 7, 9), 'hu-HU')
    expect(label).toContain('3')
    expect(label).toContain('9')
    expect(label).toContain('2026')
  })
})

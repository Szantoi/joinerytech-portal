import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTimeCursor } from '../hooks/useTimeCursor'
import { isoDate } from '../../../dates'

describe('useTimeCursor', () => {
  it('snaps a week-long window to the configured week start', () => {
    // 2026-08-05 = szerda → a hét hétfővel kezdődik
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 7, 5) }))
    expect(result.current.startIso).toBe('2026-08-03')
    expect(isoDate(result.current.end)).toBe('2026-08-09')
    expect(result.current.days).toHaveLength(7)
  })

  it('honours a Sunday week start', () => {
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 7, 5), weekStartsOn: 0 }))
    expect(result.current.startIso).toBe('2026-08-02')
  })

  it('steps a whole window forward and back', () => {
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 7, 5) }))

    act(() => result.current.next())
    expect(result.current.startIso).toBe('2026-08-10')

    act(() => result.current.previous())
    act(() => result.current.previous())
    expect(result.current.startIso).toBe('2026-07-27')
  })

  it('steps across a DST change without drifting', () => {
    // A 2026-10-26-i héten van az óraátállítás (CET): a naptári léptetés nem csúszhat.
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 9, 19) }))
    act(() => result.current.next())
    expect(result.current.startIso).toBe('2026-10-26')
    expect(result.current.days.map(isoDate)).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ])
  })

  it('supports a non-weekly window anchored on the given day', () => {
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 7, 5), length: 3 }))
    expect(result.current.days.map(isoDate)).toEqual(['2026-08-05', '2026-08-06', '2026-08-07'])

    act(() => result.current.next())
    expect(result.current.startIso).toBe('2026-08-08')
  })

  it('jumps to a given day with goTo', () => {
    const { result } = renderHook(() => useTimeCursor({ initial: new Date(2026, 7, 5) }))
    act(() => result.current.goTo(new Date(2026, 11, 24)))
    expect(result.current.startIso).toBe('2026-12-21')
  })
})

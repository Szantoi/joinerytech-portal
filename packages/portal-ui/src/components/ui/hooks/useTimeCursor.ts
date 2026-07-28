import { useCallback, useMemo, useState } from 'react'
import { addDays, isoDate, startOfDay, startOfWeek } from '../../../dates'

/**
 * useTimeCursor — csúszó idő-ablak (alapértelmezésben egy hét) navigációval.
 *
 * Provenance: a doorstar-instance hét-kurzora (uiStore `week` + `shiftWeek`)
 * általánosítva (PLAN-05 F3): tetszőleges hosszú ablak, konfigurálható
 * hétkezdettel, store-függőség nélkül.
 *
 * A léptetés **naptári** (ld. `../../../dates`), így a DST-váltás nem csúsztatja
 * el az ablakot. A `today` kívülről is megadható — a nézet így determinisztikusan
 * tesztelhető, a hook nem olvassa a rendszeridőt a hívó háta mögött.
 */

export interface TimeCursorOptions {
  /** A kezdeti ablak bármely napja (alap: ma). */
  initial?: Date
  /** Az ablak hossza napokban (alap: 7). */
  length?: number
  /**
   * A hét kezdete: 0 = vasárnap, 1 = hétfő (alap). Csak `length === 7`-nél
   * igazít hétkezdethez; egyébként az `initial` napja a kezdet.
   */
  weekStartsOn?: number
}

export interface TimeCursor {
  /** Az ablak első napja (helyi éjfél). */
  start: Date
  /** Az ablak utolsó napja (helyi éjfél). */
  end: Date
  /** Az ablak napjai sorban. */
  days: Date[]
  /** Az ablak első napja `YYYY-MM-DD` alakban (kulcsnak, lekérdezésnek). */
  startIso: string
  next: () => void
  previous: () => void
  /** Az ablakot a megadott napra (alap: ma) ugrasztja. */
  goTo: (date?: Date) => void
}

function windowStart(date: Date, length: number, weekStartsOn: number): Date {
  return length === 7 ? startOfWeek(date, weekStartsOn) : startOfDay(date)
}

export function useTimeCursor({ initial, length = 7, weekStartsOn = 1 }: TimeCursorOptions = {}): TimeCursor {
  const [start, setStart] = useState(() => windowStart(initial ?? new Date(), length, weekStartsOn))

  const next = useCallback(() => setStart((current) => addDays(current, length)), [length])
  const previous = useCallback(() => setStart((current) => addDays(current, -length)), [length])
  const goTo = useCallback(
    (date?: Date) => setStart(windowStart(date ?? new Date(), length, weekStartsOn)),
    [length, weekStartsOn],
  )

  const days = useMemo(() => Array.from({ length }, (_, index) => addDays(start, index)), [start, length])

  return { start, end: days[days.length - 1], days, startIso: isoDate(start), next, previous, goTo }
}

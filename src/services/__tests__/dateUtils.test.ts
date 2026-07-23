import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { addDays, parseDay } from '../dateUtils'

const ORIGINAL_TIME_ZONE = process.env.TZ

describe('addDays Europe/Budapest naptári napléptetése', () => {
  beforeAll(() => {
    process.env.TZ = 'Europe/Budapest'
  })

  afterAll(() => {
    if (ORIGINAL_TIME_ZONE === undefined) {
      delete process.env.TZ
      return
    }

    process.env.TZ = ORIGINAL_TIME_ZONE
  })

  it('az őszi óra-visszaállítás napját követően is a következő napot adja', () => {
    expect(parseDay('2026-10-25').getTimezoneOffset()).toBe(-120)
    expect(parseDay('2026-10-26').getTimezoneOffset()).toBe(-60)
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })

  it('a tavaszi óra-előreállításon visszafelé is egy naptári napot lép', () => {
    expect(parseDay('2026-03-29').getTimezoneOffset()).toBe(-60)
    expect(parseDay('2026-03-30').getTimezoneOffset()).toBe(-120)
    expect(addDays('2026-03-30', -1)).toBe('2026-03-29')
  })

  it('nagyobb pozitív lépéssel is helyesen átlépi az őszi DST-határt', () => {
    expect(addDays('2026-10-20', 10)).toBe('2026-10-30')
  })

  it('nagyobb negatív lépéssel is helyesen átlépi a tavaszi DST-határt', () => {
    expect(addDays('2026-03-31', -10)).toBe('2026-03-21')
  })
})

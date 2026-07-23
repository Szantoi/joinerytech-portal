import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  formatIncidentDateTime,
  fromLocalDateTimeInput,
  toLocalDateTimeInput,
} from '../incidentWizardDate'

const ORIGINAL_TIME_ZONE = process.env.TZ

describe('incident wizard helyi dátumkezelés', () => {
  beforeAll(() => {
    process.env.TZ = 'Europe/Budapest'
  })

  afterAll(() => {
    if (ORIGINAL_TIME_ZONE === undefined) delete process.env.TZ
    else process.env.TZ = ORIGINAL_TIME_ZONE
  })

  it('téli időszámításkor nem UTC-időt szeletel a datetime-local mezőbe', () => {
    expect(toLocalDateTimeInput('2026-01-15T12:30:00.000Z')).toBe('2026-01-15T13:30')
    expect(fromLocalDateTimeInput('2026-01-15T13:30')).toBe('2026-01-15T12:30:00.000Z')
  })

  it('nyári időszámításkor a kétórás Budapest-eltolást őrzi', () => {
    expect(toLocalDateTimeInput('2026-07-15T12:30:00.000Z')).toBe('2026-07-15T14:30')
    expect(fromLocalDateTimeInput('2026-07-15T14:30')).toBe('2026-07-15T12:30:00.000Z')
  })

  it('az őszi és tavaszi DST-határ két oldalán is helyes helyi időt ad', () => {
    expect(toLocalDateTimeInput('2026-03-29T00:30:00.000Z')).toBe('2026-03-29T01:30')
    expect(toLocalDateTimeInput('2026-03-29T01:30:00.000Z')).toBe('2026-03-29T03:30')
    expect(toLocalDateTimeInput('2026-10-25T00:30:00.000Z')).toBe('2026-10-25T02:30')
    expect(toLocalDateTimeInput('2026-10-25T02:30:00.000Z')).toBe('2026-10-25T03:30')
  })

  it('magyar, Budapest-időzónás összegzést készít', () => {
    expect(formatIncidentDateTime('2026-07-15T12:30:00.000Z')).toContain('14:30')
  })

  it('hibás helyi értéket fail-closed elutasít', () => {
    expect(() => fromLocalDateTimeInput('nem-dátum')).toThrow('Érvénytelen helyi dátum és idő.')
  })
})

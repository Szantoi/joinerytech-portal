import { describe, it, expect } from 'vitest'
import {
  addDays, daysBetween, daysUntilExpiry, docStats, expiryState, parseDay,
  releasedVersionInfo,
} from '../calc'

/**
 * calc unit tesztek — a prototípus DocsEngine (runtimeVersion/stats) és a
 * lejárat-előkép tükrei fix dátumokkal; a dátum-helperek helyi idejűek
 * (parseDay — nincs UTC-csapda).
 */

describe('dátum-helperek (helyi idő)', () => {
  it('parseDay helyi éjfélre bont (nincs UTC-eltolódás)', () => {
    const d = parseDay('2026-07-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
  })

  it('addDays hónap-határon át is helyes', () => {
    expect(addDays('2026-07-30', 5)).toBe('2026-08-04')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('daysBetween: előjeles naptári nap-különbség', () => {
    expect(daysBetween('2026-07-15', '2026-07-20')).toBe(5)
    expect(daysBetween('2026-07-15', '2026-07-10')).toBe(-5)
    expect(daysBetween('2026-07-15', '2026-07-15')).toBe(0)
  })
})

describe('expiryState (lejárat-ablak — config-küszöb)', () => {
  const TODAY = '2026-07-15'

  it('nincs érvényességi dátum → null', () => {
    expect(expiryState(null, TODAY)).toBeNull()
  })

  it('múltbeli dátum → lejart; a mai nap még lejaro (aznap érvényes)', () => {
    expect(expiryState('2026-07-14', TODAY)).toBe('lejart')
    expect(expiryState(TODAY, TODAY)).toBe('lejaro')
  })

  it('ablak-határ: warnDays-en belül lejaro, azon túl null (paraméterezhető küszöb)', () => {
    expect(expiryState('2026-07-25', TODAY, 10)).toBe('lejaro')  // pont a határ
    expect(expiryState('2026-07-26', TODAY, 10)).toBeNull()      // határ + 1
    // az alapértelmezett ablak a configból jön (EXPIRY_WARN_DAYS = 30)
    expect(expiryState('2026-08-14', TODAY)).toBe('lejaro')
    expect(expiryState('2026-12-01', TODAY)).toBeNull()
  })

  it('daysUntilExpiry: hátralévő (vagy negatív eltelt) napok; null dátum → null', () => {
    expect(daysUntilExpiry('2026-07-20', TODAY)).toBe(5)
    expect(daysUntilExpiry('2026-07-05', TODAY)).toBe(-10)
    expect(daysUntilExpiry(null, TODAY)).toBeNull()
  })
})

describe('releasedVersionInfo (DocsEngine.runtimeVersion tükör)', () => {
  it('kiadott dokumentum: az aktuális verzió az érvényes (clear)', () => {
    const info = releasedVersionInfo('kiadott', 3, [
      { v: 1, status: 'kiadott' }, { v: 2, status: 'kiadott' }, { v: 3, status: 'kiadott' },
    ])
    expect(info).toEqual({ runVersion: 3, clear: true, pendingVersion: null, blocked: false })
  })

  it('ellenőrzés alatt lévő v2: a műhely a kiadott v1-et használja (pending)', () => {
    const info = releasedVersionInfo('ellenorzes', 2, [
      { v: 1, status: 'kiadott' }, { v: 2, status: 'ellenorzes' },
    ])
    expect(info).toEqual({ runVersion: 1, clear: false, pendingVersion: 2, blocked: false })
  })

  it('sosem volt kiadás → blocked (gyártásban nem használható)', () => {
    const info = releasedVersionInfo('ellenorzes', 1, [{ v: 1, status: 'ellenorzes' }])
    expect(info).toEqual({ runVersion: null, clear: false, pendingVersion: 1, blocked: true })
  })

  it('archivált dokumentum: a lánc kiadott bejegyzése megőrzött (runVersion a láncból)', () => {
    const info = releasedVersionInfo('archivalt', 1, [{ v: 1, status: 'kiadott' }])
    expect(info.runVersion).toBe(1)
    expect(info.clear).toBe(false)
  })

  it('a legmagasabb kiadott verzió számít (nem az első)', () => {
    const info = releasedVersionInfo('piszkozat', 3, [
      { v: 1, status: 'kiadott' }, { v: 2, status: 'kiadott' }, { v: 3, status: 'piszkozat' },
    ])
    expect(info.runVersion).toBe(2)
  })
})

describe('docStats (DocsEngine.stats tükör)', () => {
  it('státuszonkénti darabszámok + összes', () => {
    const stats = docStats([
      { status: 'kiadott' }, { status: 'kiadott' }, { status: 'ellenorzes' },
      { status: 'piszkozat' }, { status: 'archivalt' },
    ])
    expect(stats).toEqual({ total: 5, kiadott: 2, ellenorzes: 1, piszkozat: 1, archivalt: 1 })
  })

  it('üres lista → csupa nulla', () => {
    expect(docStats([])).toEqual({ total: 0, kiadott: 0, ellenorzes: 0, piszkozat: 0, archivalt: 0 })
  })
})

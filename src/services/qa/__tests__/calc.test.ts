import { describe, it, expect } from 'vitest'
import {
  addDays, startOfWeek, hoursBetween, pct,
  isInspectionBlocking, calcQaMetrics, weeklyInspectionTrend,
} from '../calc'

/**
 * calc unit tesztek — a backend lekérdezés-tükrök tiszta függvényei fix
 * dátumokkal: gyártás-blokkolás (GetBlockingInspectionsQuery), QA-metrikák
 * (GetQAMetricsQueryHandler/QAMetricsDto) és a heti trend-bontás.
 */

describe('dátum-helperek', () => {
  it('addDays hónap-határon át is működik', () => {
    expect(addDays('2026-06-29', 3)).toBe('2026-07-02')
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30')
  })

  it('startOfWeek: hétfőt ad vissza (vasárnapra az előző hétfőt)', () => {
    expect(startOfWeek('2026-07-15')).toBe('2026-07-13') // szerda → hétfő
    expect(startOfWeek('2026-07-13')).toBe('2026-07-13') // hétfő → önmaga
    expect(startOfWeek('2026-07-19')).toBe('2026-07-13') // vasárnap → előző hétfő
  })

  it('hoursBetween: előjeles óra-különbség dátum-idő kulcsokra', () => {
    expect(hoursBetween('2026-07-10T09:00', '2026-07-10T15:00')).toBe(6)
    expect(hoursBetween('2026-07-10T09:00', '2026-07-11T09:00')).toBe(24)
  })

  it('pct: kerekített százalék; 0 nevezőre null (a UI —-t mutat)', () => {
    expect(pct(1, 3)).toBe(33)
    expect(pct(2, 3)).toBe(67)
    expect(pct(0, 5)).toBe(0)
    expect(pct(3, 0)).toBeNull()
  })
})

describe('isInspectionBlocking (GetBlockingInspectionsQuery tükör)', () => {
  it('KRITIKUS ponton selejt → blokkol; minden más kombináció nem', () => {
    expect(isInspectionBlocking({ status: 'selejt', criticalLevel: 'kritikus' })).toBe(true)
    expect(isInspectionBlocking({ status: 'selejt', criticalLevel: 'jelentos' })).toBe(false)
    expect(isInspectionBlocking({ status: 'selejt', criticalLevel: 'enyhe' })).toBe(false)
    expect(isInspectionBlocking({ status: 'megfelelt', criticalLevel: 'kritikus' })).toBe(false)
    expect(isInspectionBlocking({ status: 'folyamatban', criticalLevel: 'kritikus' })).toBe(false)
  })
})

describe('calcQaMetrics (QAMetricsDto tükör)', () => {
  it('pass rate = megfelelt / ÖSSZES átvizsgálás (backend-számítás); üresre 0', () => {
    const metrics = calcQaMetrics(
      [
        { status: 'megfelelt' }, { status: 'megfelelt' },
        { status: 'selejt' }, { status: 'nyitott' },
      ],
      [],
    )
    expect(metrics.totalInspections).toBe(4)
    expect(metrics.passedInspections).toBe(2)
    expect(metrics.failedInspections).toBe(1)
    expect(metrics.passRate).toBe(0.5) // 2/4 — a nyitott is a nevezőben (DTO-tükör)

    expect(calcQaMetrics([], []).passRate).toBe(0)
  })

  it('nyitott hibajegyek a nevesített guard szerint; átlagos megoldási idő órában', () => {
    const metrics = calcQaMetrics([], [
      { status: 'bejelentve', reportedAt: '2026-07-01T08:00', resolvedAt: null },
      { status: 'folyamatban', reportedAt: '2026-07-01T08:00', resolvedAt: null },
      // 48 óra és 24 óra alatt megoldva → átlag 36 óra
      { status: 'megoldva', reportedAt: '2026-07-01T08:00', resolvedAt: '2026-07-03T08:00' },
      { status: 'megoldva', reportedAt: '2026-07-05T08:00', resolvedAt: '2026-07-06T08:00' },
      { status: 'elutasitva', reportedAt: '2026-07-02T08:00', resolvedAt: null },
    ])
    expect(metrics.totalTickets).toBe(5)
    expect(metrics.openTickets).toBe(2) // bejelentve + folyamatban (elutasitva nem nyitott)
    expect(metrics.averageResolutionHours).toBe(36)
  })

  it('átlagos megoldási idő null, ha nincs megoldott hibajegy (DTO-tükör)', () => {
    const metrics = calcQaMetrics([], [
      { status: 'bejelentve', reportedAt: '2026-07-01T08:00', resolvedAt: null },
    ])
    expect(metrics.averageResolutionHours).toBeNull()
  })
})

describe('weeklyInspectionTrend', () => {
  const TODAY = '2026-07-15' // szerda; a hét hétfője: 2026-07-13

  it('a kért számú hetet adja, legrégebbi elöl, a mai hét zár', () => {
    const trend = weeklyInspectionTrend([], TODAY, 3)
    expect(trend.map((w) => w.weekStart)).toEqual(['2026-06-29', '2026-07-06', '2026-07-13'])
  })

  it('a lezárásokat a completedAt hete szerint gyűjti; ablakon kívülit eldob; nyitottat kihagy', () => {
    const trend = weeklyInspectionTrend(
      [
        { status: 'megfelelt', completedAt: '2026-07-14T10:00' }, // mai hét
        { status: 'selejt', completedAt: '2026-07-13T09:00' },    // mai hét
        { status: 'megfelelt', completedAt: '2026-07-07T09:00' }, // előző hét
        { status: 'megfelelt', completedAt: '2026-06-01T09:00' }, // ablakon kívül
        { status: 'folyamatban', completedAt: null },              // nyitott — nem számít
      ],
      TODAY,
      2,
    )
    expect(trend).toHaveLength(2)
    expect(trend[0]).toMatchObject({ weekStart: '2026-07-06', total: 1, passed: 1, failed: 0, passRatePct: 100 })
    expect(trend[1]).toMatchObject({ weekStart: '2026-07-13', total: 2, passed: 1, failed: 1, passRatePct: 50 })
  })

  it('lezárás nélküli hétre a passRatePct null (nem 0 — nincs adat)', () => {
    const trend = weeklyInspectionTrend([], TODAY, 1)
    expect(trend[0].total).toBe(0)
    expect(trend[0].passRatePct).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import {
  calcCategoryCosts, calcProjectCosts, marginBand, marginPct,
  type CostLineInput,
} from '../calc'

/**
 * calc — a backend ProjectCostCalculation tükör-számításainak tesztjei
 * (EAC = kategóriánkénti MAX, variance, fedezet, korrekció-hatás).
 */

const LINES: CostLineInput[] = [
  { category: 'anyag', plan: 100_000, actual: 120_000 },
  { category: 'anyag', plan: 20_000, actual: 0 },
  { category: 'munka', plan: 80_000, actual: 60_000 },
  { category: 'rezsi', plan: 24_000, actual: 21_600 },
]

describe('calcCategoryCosts', () => {
  it('kategóriánként összegez és az EAC-vetítés a MAX(terv, tény)', () => {
    const rows = calcCategoryCosts(LINES)
    const anyag = rows.find((r) => r.category === 'anyag')!
    // két anyag-sor összege
    expect(anyag.plan).toBe(120_000)
    expect(anyag.actual).toBe(120_000)
    expect(anyag.projected).toBe(120_000)

    const munka = rows.find((r) => r.category === 'munka')!
    expect(munka.projected).toBe(80_000) // terv > tény → a terv a vetítés
    expect(munka.variance).toBe(-20_000)
  })

  it('a korrekció a kategória TÉNY-értékét tolja el (a tervet nem)', () => {
    const rows = calcCategoryCosts(LINES, [{ category: 'munka', amount: 30_000 }])
    const munka = rows.find((r) => r.category === 'munka')!
    expect(munka.plan).toBe(80_000)
    expect(munka.actual).toBe(90_000)
    expect(munka.projected).toBe(90_000) // a korrekcióval már tény > terv
  })

  it('terv nélküli kategóriára adott korrekció új sort nyit (negatívnál 0 a vetítés)', () => {
    const rows = calcCategoryCosts(LINES, [{ category: 'beszallito', amount: -35_000 }])
    const beszallito = rows.find((r) => r.category === 'beszallito')!
    expect(beszallito.plan).toBe(0)
    expect(beszallito.actual).toBe(-35_000)
    expect(beszallito.projected).toBe(0) // MAX(0, −35 000)
  })

  it('kanonikus kategória-sorrendben ad vissza, üres kategória nélkül', () => {
    expect(calcCategoryCosts(LINES).map((r) => r.category)).toEqual(['anyag', 'munka', 'rezsi'])
  })
})

describe('calcProjectCosts', () => {
  it('összesenek + fedezet-százalékok', () => {
    const c = calcProjectCosts(400_000, LINES)
    expect(c.planTotal).toBe(224_000)
    expect(c.actualTotal).toBe(201_600)
    expect(c.eacTotal).toBe(120_000 + 80_000 + 24_000)
    expect(c.variance).toBe(-22_400)
    expect(c.variancePct).toBeCloseTo(-0.1, 5)
    expect(c.planMarginPct).toBeCloseTo((400_000 - 224_000) / 400_000, 5)
    expect(c.eacMarginPct).toBeCloseTo((400_000 - 224_000) / 400_000, 5)
  })

  it('nulla árbevételnél a fedezet nem értelmezett (null)', () => {
    const c = calcProjectCosts(0, LINES)
    expect(c.planMarginPct).toBeNull()
    expect(c.actualMarginPct).toBeNull()
    expect(c.eacMarginPct).toBeNull()
  })
})

describe('marginPct / marginBand', () => {
  it('fedezet-sávok a konfigurált küszöbökkel', () => {
    expect(marginBand(null)).toBe('none')
    expect(marginBand(-0.01)).toBe('loss')
    expect(marginBand(0.1)).toBe('weak')
    expect(marginBand(0.15)).toBe('medium')
    expect(marginBand(0.29)).toBe('medium')
    expect(marginBand(0.3)).toBe('good')
  })

  it('marginPct: (árbevétel − költség) / árbevétel', () => {
    expect(marginPct(1_000_000, 750_000)).toBeCloseTo(0.25, 5)
    expect(marginPct(0, 100)).toBeNull()
  })
})

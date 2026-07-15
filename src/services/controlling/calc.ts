import { MARGIN_GOOD_THRESHOLD, MARGIN_WEAK_THRESHOLD } from './config'

/**
 * calc — a Kontrolling backend számításainak tükre, tiszta (tesztelhető)
 * függvényekként (az EHS validity.ts mintája).
 *
 * Forrás: spaceos-modules-kontrolling `ProjectCostCalculation` aggregátum:
 *  - EAC kategóriánként: projected = MAX(terv, tény) (CategoryCost.Projected),
 *  - variance = tény − terv, fedezet = (árbevétel − költség) / árbevétel,
 *  - a költség-korrekciók (CostAdjustment) a kategória TÉNY-értékét módosítják.
 *
 * Ugyanezt a modult futtatja a UI (megjelenítés) és az MSW mock (a válaszok
 * kiszámítása) — egy igazságforrás.
 */

// ── Kategória-készlet (kanonikus magyar kulcsok ↔ backend CostCategory) ─────
// anyag=Material, munka=Labor, bermunka=Subcontracting, szallitas=Logistics,
// beszallito=Supplier, rezsi=Overhead
export const COST_CATEGORIES = [
  'anyag', 'munka', 'bermunka', 'szallitas', 'beszallito', 'rezsi',
] as const
export type CostCategory = (typeof COST_CATEGORIES)[number]

/** Költségsor-bemenet (projekt `lines`). */
export interface CostLineInput {
  category: CostCategory
  plan: number
  actual: number
}

/** Korrekció-bemenet (utókalkuláció) — a kategória tény-értékét tolja el. */
export interface AdjustmentInput {
  category: CostCategory
  amount: number
}

/** Egy kategória számított költségképe (backend CategoryCostDto tükre). */
export interface CategoryCost {
  category: CostCategory
  plan: number
  /** Tény, a projekt-hatályú korrekciókkal együtt. */
  actual: number
  /** EAC-vetítés: MAX(terv, tény) — a backend Projected tükre. */
  projected: number
  /** tény − terv (pozitív = terv feletti költés). */
  variance: number
}

/** Projekt-szintű számított összkép (backend CostSummaryDto tükre). */
export interface ProjectCosts {
  byCategory: CategoryCost[]
  planTotal: number
  actualTotal: number
  /** EAC = Σ projected (kategóriánkénti MAX-ok összege). */
  eacTotal: number
  variance: number
  /** variance / planTotal — terv nélkül nincs értelmezve (null). */
  variancePct: number | null
  planMarginPct: number | null
  actualMarginPct: number | null
  eacMarginPct: number | null
}

/** Fedezet-százalék: (árbevétel − költség) / árbevétel; 0 árbevételnél null. */
export function marginPct(revenue: number, cost: number): number | null {
  return revenue > 0 ? (revenue - cost) / revenue : null
}

/** Fedezet-sáv a konfigurált küszöbökkel (címke/tónus a labels.ts-ben). */
export type MarginBand = 'none' | 'loss' | 'weak' | 'medium' | 'good'

export function marginBand(pct: number | null): MarginBand {
  if (pct == null) return 'none'
  if (pct < 0) return 'loss'
  if (pct < MARGIN_WEAK_THRESHOLD) return 'weak'
  if (pct < MARGIN_GOOD_THRESHOLD) return 'medium'
  return 'good'
}

/**
 * Kategóriánkénti költségkép a költségsorokból + korrekciókból.
 * Csak a ténylegesen előforduló kategóriák szerepelnek, kanonikus sorrendben.
 */
export function calcCategoryCosts(
  lines: CostLineInput[],
  adjustments: AdjustmentInput[] = [],
): CategoryCost[] {
  const plan = new Map<CostCategory, number>()
  const actual = new Map<CostCategory, number>()

  for (const line of lines) {
    plan.set(line.category, (plan.get(line.category) ?? 0) + line.plan)
    actual.set(line.category, (actual.get(line.category) ?? 0) + line.actual)
  }
  for (const adj of adjustments) {
    actual.set(adj.category, (actual.get(adj.category) ?? 0) + adj.amount)
  }

  return COST_CATEGORIES.filter((c) => plan.has(c) || actual.has(c)).map((category) => {
    const p = plan.get(category) ?? 0
    const a = actual.get(category) ?? 0
    return { category, plan: p, actual: a, projected: Math.max(p, a), variance: a - p }
  })
}

/** Projekt-szintű számítás (EAC + variance + fedezetek) egy lépésben. */
export function calcProjectCosts(
  contractValue: number,
  lines: CostLineInput[],
  adjustments: AdjustmentInput[] = [],
): ProjectCosts {
  const byCategory = calcCategoryCosts(lines, adjustments)
  const planTotal = byCategory.reduce((s, c) => s + c.plan, 0)
  const actualTotal = byCategory.reduce((s, c) => s + c.actual, 0)
  const eacTotal = byCategory.reduce((s, c) => s + c.projected, 0)
  const variance = actualTotal - planTotal

  return {
    byCategory,
    planTotal,
    actualTotal,
    eacTotal,
    variance,
    variancePct: planTotal > 0 ? variance / planTotal : null,
    planMarginPct: marginPct(contractValue, planTotal),
    actualMarginPct: marginPct(contractValue, actualTotal),
    eacMarginPct: marginPct(contractValue, eacTotal),
  }
}

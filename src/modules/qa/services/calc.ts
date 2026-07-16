import { TREND_WINDOW_WEEKS } from './config'
import {
  isInspectionDone, isTicketOpen,
  type InspectionStatus, type TicketStatus,
} from './fsm'
import { addDays, formatDay, parseDay } from '../../../services/dateUtils'

/**
 * calc — a QA backend lekérdezés-logikáinak tükre, tiszta (tesztelhető)
 * függvényekként (a HR/Kontrolling/Maintenance calc.ts mintája):
 *
 *  1. `isInspectionBlocking` = a `GetBlockingInspectionsQuery` / a
 *     `CompleteWithFail()` KRITIKUS-ága — a kritikus ellenőrzési ponton
 *     megbukott átvizsgálás BLOKKOLJA a gyártást. A mező SZÁMÍTOTT, sosem
 *     tárolt: az MSW kiszolgáláskor számítja, a kliens csak megjeleníti.
 *  2. `calcQaMetrics` = a `GetQAMetricsQueryHandler` tükre (QAMetricsDto):
 *     pass rate = megfelelt / ÖSSZES átvizsgálás (0, ha nincs); átlagos
 *     megoldási idő = a megoldott hibajegyek (resolvedAt − reportedAt)
 *     átlaga órában (null, ha nincs megoldott).
 *  3. `weeklyInspectionTrend` — a metrics dátum-ablakos heti bontása a
 *     trend-nézethez (a backend GetQAMetricsQuery from/to paraméterezésének
 *     kliens-oldali előképe; endpoint még nincs — backend-gap).
 *
 * Ugyanezt a modult futtatja a UI (megjelenítés) és az MSW mock (a
 * blocking/openTickets mezők kiszolgálás-kori számítása) — egy igazságforrás.
 */

// ── Dátum-helperek — a közös services/dateUtils-ból (helyi idő, YYYY-MM-DD) ──
// Re-export, hogy a modul-API (services/qa) változatlan maradjon.

export { parseDay, formatDay, addDays, todayIso } from '../../../services/dateUtils'

const HOUR_MS = 3_600_000

/** A napot tartalmazó naptári hét hétfője (YYYY-MM-DD). */
export function startOfWeek(iso: string): string {
  const d = parseDay(iso)
  const dow = d.getDay() // 0 = vasárnap
  return addDays(formatDay(d), dow === 0 ? -6 : 1 - dow)
}

/** Két időpont (YYYY-MM-DD[THH:mm]) különbsége órában (b − a). */
export function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / HOUR_MS
}

/** Százalék egészre kerekítve; null, ha a nevező 0 (a UI '—'-t mutat). */
export function pct(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null
}

// ── Gyártás-blokkolás (GetBlockingInspectionsQuery tükör) ───────────────────

/** A backend CriticalLevel (Critical/Major/Minor) kanonikus kulcsai. */
export type CriticalLevel = 'kritikus' | 'jelentos' | 'enyhe'

/** Strukturális bemenet — a service- és a mock-típusok is megfelelnek neki. */
export interface BlockingInspectionInput {
  status: InspectionStatus
  criticalLevel: CriticalLevel
}

/** Kritikus ellenőrzési ponton selejt → blokkolja a gyártást (backend-tükör). */
export function isInspectionBlocking(inspection: BlockingInspectionInput): boolean {
  return inspection.status === 'selejt' && inspection.criticalLevel === 'kritikus'
}

// ── QA-metrikák (GetQAMetricsQueryHandler / QAMetricsDto tükör) ─────────────

export interface QaMetricsInspectionInput {
  status: InspectionStatus
}

export interface QaMetricsTicketInput {
  status: TicketStatus
  reportedAt: string
  resolvedAt: string | null
}

/** A backend QAMetricsDto tükre (AverageResolutionTime → óra). */
export interface QaMetrics {
  totalInspections: number
  passedInspections: number
  failedInspections: number
  /** Backend-tükör: megfelelt / ÖSSZES átvizsgálás, 0..1 (0, ha nincs). */
  passRate: number
  totalTickets: number
  openTickets: number
  /** Átlagos megoldási idő órában; null, ha nincs megoldott hibajegy. */
  averageResolutionHours: number | null
}

export function calcQaMetrics(
  inspections: QaMetricsInspectionInput[],
  tickets: QaMetricsTicketInput[],
): QaMetrics {
  const passed = inspections.filter((i) => i.status === 'megfelelt').length
  const failed = inspections.filter((i) => i.status === 'selejt').length

  const resolutionHours = tickets
    .filter((t) => t.status === 'megoldva' && t.resolvedAt !== null)
    .map((t) => hoursBetween(t.reportedAt, t.resolvedAt!))

  return {
    totalInspections: inspections.length,
    passedInspections: passed,
    failedInspections: failed,
    passRate: inspections.length > 0 ? passed / inspections.length : 0,
    totalTickets: tickets.length,
    openTickets: tickets.filter((t) => isTicketOpen(t.status)).length,
    averageResolutionHours:
      resolutionHours.length > 0
        ? resolutionHours.reduce((sum, h) => sum + h, 0) / resolutionHours.length
        : null,
  }
}

// ── Heti trend (a metrics dátum-ablakos bontása a trend-nézethez) ───────────

export interface TrendInspectionInput {
  status: InspectionStatus
  completedAt: string | null
}

export interface WeekBucket {
  /** A hét hétfője (YYYY-MM-DD) — a sor kulcsa és címkéje. */
  weekStart: string
  /** A héten lezárt átvizsgálások (megfelelt + selejt). */
  total: number
  passed: number
  failed: number
  /** Megfelelési arány a héten lezártakra (%); null, ha nem volt lezárás. */
  passRatePct: number | null
}

/**
 * Heti bontású megfelelési trend a lezárt átvizsgálásokból, a legrégebbi
 * héttel kezdve. Az ablak: a mai napot tartalmazó héttel bezárólag `weeks` hét.
 */
export function weeklyInspectionTrend(
  inspections: TrendInspectionInput[],
  today: string,
  weeks: number = TREND_WINDOW_WEEKS,
): WeekBucket[] {
  const currentWeek = startOfWeek(today)
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(currentWeek, (i - weeks + 1) * 7),
    total: 0, passed: 0, failed: 0, passRatePct: null,
  }))
  const byWeek = new Map(buckets.map((b) => [b.weekStart, b]))

  for (const inspection of inspections) {
    if (!isInspectionDone(inspection.status) || inspection.completedAt === null) continue
    const bucket = byWeek.get(startOfWeek(inspection.completedAt.slice(0, 10)))
    if (!bucket) continue // az ablakon kívüli lezárás nem számít bele
    bucket.total += 1
    if (inspection.status === 'megfelelt') bucket.passed += 1
    else bucket.failed += 1
  }

  for (const bucket of buckets) {
    bucket.passRatePct = pct(bucket.passed, bucket.total)
  }
  return buckets
}

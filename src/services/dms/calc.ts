import { EXPIRY_WARN_DAYS } from './config'
import type { DocumentStatus } from './fsm'

/**
 * calc — a DMS lekérdezés-logikáinak tükre, tiszta (tesztelhető) függvényekként
 * (a QA/HR/Maintenance calc.ts mintája):
 *
 *  1. `releasedVersionInfo` = a prototípus `DocsEngine.runtimeVersion()` tükre:
 *     a műhely/CNC a legutolsó KIADOTT verziót használja — ha az aktuális
 *     verzió még nem kiadott, a korábbi kiadott az érvényes; ha sosem volt
 *     kiadás, a dokumentum gyártásban nem használható (blocked).
 *     A `releasedVersion` mező SZÁMÍTOTT, sosem tárolt: az MSW kiszolgáláskor
 *     számítja, a kliens csak megjeleníti.
 *  2. `expiryState` = a backend IDocumentExpiryService / `GET /search/expiring`
 *     előképe: lejárt vagy a config-ablakon (EXPIRY_WARN_DAYS) belül lejáró
 *     dokumentum felülvizsgálandó. Az `expiry` mező szintén kiszolgáláskor
 *     számított.
 *  3. `docStats` = a prototípus `DocsEngine.stats()` tükre (dashboard KPI-k).
 *
 * Ugyanezt a modult futtatja a UI (megjelenítés) és az MSW mock — egy
 * igazságforrás.
 */

// ── Dátum-helperek (helyi idő, YYYY-MM-DD kulcsok) ──────────────────────────
// MEGJEGYZÉS: azonos helperek élnek a services/{hr,maintenance,qa}/calc.ts
// fájlokban — közös services/dateUtils-ba emelésük dokumentált follow-up
// (F2-MAINTENANCE-FE 6. / F2-QA-FE 8. pont). NE `new Date(iso)`: az a
// dátum-only stringet UTC-ként értelmezi (review-lecke — UTC-csapda).

const DAY_MS = 86_400_000

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(iso: string, days: number): string {
  return formatDay(new Date(parseDay(iso).getTime() + days * DAY_MS))
}

/** Mai nap (helyi idő) YYYY-MM-DD kulcsként. */
export function todayIso(): string {
  return formatDay(new Date())
}

/** Naptári napok száma a-tól b-ig (b − a; negatív, ha b a múltban van). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / DAY_MS)
}

// ── Érvényes (kiadott) verzió — DocsEngine.runtimeVersion tükör ─────────────

/** Strukturális bemenet — a service- és a mock-verziósorok is megfelelnek neki. */
export interface ReleasedVersionEntryInput {
  v: number
  status: DocumentStatus
}

export interface ReleasedVersionInfo {
  /** A legutolsó KIADOTT verziószám — a műhely EZT használja; null, ha nincs. */
  runVersion: number | null
  /** Az aktuális verzió maga kiadott (nincs függő munkapéldány). */
  clear: boolean
  /** Ki nem adott újabb munkapéldány verziószáma (ha van). */
  pendingVersion: number | null
  /** Nincs egyetlen kiadott verzió sem — gyártásban nem használható. */
  blocked: boolean
}

export function releasedVersionInfo(
  status: DocumentStatus,
  currentVersion: number,
  versions: ReleasedVersionEntryInput[],
): ReleasedVersionInfo {
  if (status === 'kiadott') {
    return { runVersion: currentVersion, clear: true, pendingVersion: null, blocked: false }
  }
  const released = versions
    .filter((entry) => entry.status === 'kiadott')
    .sort((a, b) => b.v - a.v)[0]
  return {
    runVersion: released ? released.v : null,
    clear: false,
    pendingVersion: currentVersion,
    blocked: !released,
  }
}

// ── Lejárat-figyelés (IDocumentExpiryService / GET /search/expiring előkép) ─

/** lejart = a validUntil elmúlt; lejaro = a config-ablakon belül lejár. */
export type ExpiryState = 'lejart' | 'lejaro'

/**
 * A dokumentum lejárat-állapota a mai naphoz képest; null, ha nincs
 * érvényességi dátum, vagy az ablakon (warnDays) kívül esik. A validUntil
 * napja még érvényes (aznap → 'lejaro', nem 'lejart').
 */
export function expiryState(
  validUntil: string | null,
  today: string,
  warnDays: number = EXPIRY_WARN_DAYS,
): ExpiryState | null {
  if (validUntil === null) return null
  const days = daysBetween(today, validUntil)
  if (days < 0) return 'lejart'
  if (days <= warnDays) return 'lejaro'
  return null
}

/** Hátralévő napok a lejáratig (negatív: ennyi napja lejárt); null, ha nincs dátum. */
export function daysUntilExpiry(validUntil: string | null, today: string): number | null {
  return validUntil === null ? null : daysBetween(today, validUntil)
}

// ── Állomány-statisztika (DocsEngine.stats tükör — dashboard KPI-k) ─────────

export interface DocStatsInput {
  status: DocumentStatus
}

export interface DocStats {
  total: number
  kiadott: number
  ellenorzes: number
  piszkozat: number
  archivalt: number
}

export function docStats(docs: DocStatsInput[]): DocStats {
  const count = (status: DocumentStatus) => docs.filter((d) => d.status === status).length
  return {
    total: docs.length,
    kiadott: count('kiadott'),
    ellenorzes: count('ellenorzes'),
    piszkozat: count('piszkozat'),
    archivalt: count('archivalt'),
  }
}

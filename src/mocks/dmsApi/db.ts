import { HttpResponse } from 'msw'
import type { DmsDocument } from '../../services/dms/documents'
import { expiryState, releasedVersionInfo, todayIso } from '../../services/dms/calc'
import { canTransition, type FsmRule } from '../../services/dms/fsm'
import { seedDocuments, type DocumentSeed } from './seed'

/**
 * DMS mock adatbázis — állapottartó in-memory store az MSW handlerekhez
 * (a qaApi/maintenanceApi db.ts mintája). A backend Document-magnak nincs
 * futtatható endpoint-rétege, ezért a kontraktus MSW-first tükör: a mutációk
 * perzisztálnak a munkameneten belül, a tiltott FSM-átmenetekre a közös
 * guard-táblával egyezően 409-et ad.
 *
 * A `releasedVersion` és `expiry` mezők NEM tároltak: kiszolgáláskor számítjuk
 * (services/dms/calc — runtimeVersion- és expiry-tükör).
 */

export interface DmsDb {
  documents: DocumentSeed[]
}

function createDb(): DmsDb {
  return { documents: seedDocuments() }
}

let db = createDb()

export function getDmsDb(): DmsDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetDmsDb(): void {
  db = createDb()
}

/** Kiszolgálás-kori számított mezők (calc-tükör): releasedVersion + expiry. */
export function serveDocument(seed: DocumentSeed): DmsDocument {
  return {
    ...seed,
    releasedVersion: releasedVersionInfo(seed.status, seed.version, seed.versions).runVersion,
    expiry: expiryState(seed.validUntil, todayIso()),
  }
}

// ── HTTP helperek (a qaApi/maintenanceApi mintája) ──────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a leendő backend aggregátum-guardok előképe: tiltott átmenet →
 * 409 Conflict a szabálysértést leíró üzenettel. Engedélyezettnél null.
 */
export function guardTransition<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
): Response | null {
  if (canTransition(fsm, action, status)) return null
  return jsonError(
    409,
    'Conflict',
    `Érvénytelen FSM-átmenet: „${status}" állapotból nem hajtható végre a(z) „${action}" művelet.`,
  )
}

/** Időbélyeg a mock-formátumban (YYYY-MM-DDTHH:mm — Date-parszolható). */
export function isoTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

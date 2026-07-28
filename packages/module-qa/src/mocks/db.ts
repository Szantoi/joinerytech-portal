import { HttpResponse } from 'msw'
import type { Inspection } from '../services/inspections'
import type { Ticket } from '../services/tickets'
import { isInspectionBlocking } from '../services/calc'
import { canTransition, isTicketOpen, type FsmRule } from '../services/fsm'
import { seedInspections, seedTickets } from './seed'

/**
 * QA mock adatbázis — állapottartó in-memory store az MSW handlerekhez
 * (a maintenanceApi/hrApi db.ts mintája). A backend QA API-ja részleges
 * (Inspection végpontok 204-gyel, Ticket végpontok NINCSENEK), ezért a
 * kontraktus MSW-first tükör: a mutációk perzisztálnak a munkameneten belül,
 * a tiltott FSM-átmenetekre a backend guardokkal egyezően 409-et ad.
 *
 * A `blocking` és `openTickets` mezők NEM tároltak: kiszolgáláskor számítjuk
 * (services/qa/calc + TICKET_OPEN_STATUSES guard) — backend-tükör.
 */

/** Tárolt átvizsgálás — a számított mezők nélkül (azokat a serve adja). */
export type InspectionSeed = Omit<Inspection, 'blocking' | 'openTickets'>

export interface QaDb {
  inspections: InspectionSeed[]
  tickets: Ticket[]
}

function createDb(): QaDb {
  return {
    inspections: seedInspections(),
    tickets: seedTickets(),
  }
}

let db = createDb()

export function getQaDb(): QaDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetQaDb(): void {
  db = createDb()
}

/** Kiszolgálás-kori számított mezők (calc-tükör): blocking + openTickets. */
export function serveInspection(seed: InspectionSeed): Inspection {
  return {
    ...seed,
    blocking: isInspectionBlocking(seed),
    openTickets: db.tickets.filter(
      (t) => t.inspectionId === seed.id && isTicketOpen(t.status),
    ).length,
  }
}

// ── HTTP helperek (a maintenanceApi/hrApi mintája) ──────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a backend aggregátum-guardok előképe: tiltott átmenet →
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

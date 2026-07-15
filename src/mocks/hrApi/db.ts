import { HttpResponse } from 'msw'
import type { Employee } from '../../services/hr/employees'
import type { Absence } from '../../services/hr/absences'
import type { Assignment } from '../../services/hr/assignments'
import type { TimeLog } from '../../services/hr/timeLogs'
import { canTransition, type FsmRule } from '../../services/hr/fsm'
import { seedAbsences, seedAssignments, seedEmployees, seedTimeLogs } from './seed'

/**
 * HR mock adatbázis — állapottartó in-memory store az MSW handlerekhez
 * (az ehsApi/crmApi db.ts mintája). A backend HR hostig ez A kontraktus
 * (MSW-first): a mutációk perzisztálnak a munkameneten belül, a tiltott
 * FSM-átmenetekre a backend guardokkal egyezően 409-et ad.
 */

export interface HrDb {
  employees: Employee[]
  absences: Absence[]
  assignments: Assignment[]
  timeLogs: TimeLog[]
}

function createDb(): HrDb {
  return {
    employees: seedEmployees(),
    absences: seedAbsences(),
    assignments: seedAssignments(),
    timeLogs: seedTimeLogs(),
  }
}

let db = createDb()

export function getHrDb(): HrDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetHrDb(): void {
  db = createDb()
}

// ── HTTP helperek (az ehsApi/crmApi mintája) ────────────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a backend AbsenceStatusTransitions előképe: tiltott átmenet →
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

/** Aki a mockban dönt (jóváhagyó) — auth-bekötésig konstans. */
export const MOCK_APPROVER = 'Kovács Péter'

/** Napló-időbélyeg a meglévő mock-formátumban (YYYY-MM-DD HH:mm). */
export function logTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

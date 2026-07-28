import { HttpResponse } from 'msw'
import type { Lead } from '../services/leads'
import type { Opportunity } from '../services/opportunities'
import type { CrmTask } from '../services/tasks'
import { canTransition, type FsmRule } from '../services/fsm'
import { seedLeads, seedOpps, seedTasks } from './seed'

/**
 * CRM mock adatbázis — állapottartó in-memory store az MSW handlerekhez
 * (az ehsApi/db.ts mintája). A backend CRM hostig ez A kontraktus (MSW-first):
 * a mutációk perzisztálnak a munkameneten belül, a tiltott FSM-átmenetekre
 * a leendő backenddel egyezően 409-et ad.
 */

export interface CrmDb {
  leads: Lead[]
  opps: Opportunity[]
  tasks: CrmTask[]
}

function createDb(): CrmDb {
  return {
    leads: seedLeads(),
    opps: seedOpps(),
    tasks: seedTasks(),
  }
}

let db = createDb()

export function getCrmDb(): CrmDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetCrmDb(): void {
  db = createDb()
}

// ── HTTP helperek (az ehsApi mintája) ───────────────────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a leendő backend domain guard előképe: tiltott átmenet → 409
 * Conflict a szabálysértést leíró üzenettel. Engedélyezettnél null.
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

/** Tevékenységnapló-időbélyeg a meglévő mock-formátumban (YYYY-MM-DD HH:mm). */
export function activityTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

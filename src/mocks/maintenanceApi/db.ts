import { HttpResponse } from 'msw'
import type { WorkOrder } from '../../services/maintenance/workOrders'
import { canTransition, type FsmRule } from '../../services/maintenance/fsm'
import { seedAssets, seedWorkOrders, type AssetSeed } from './seed'

/**
 * Maintenance mock adatbázis — állapottartó in-memory store az MSW
 * handlerekhez (a hrApi/crmApi db.ts mintája). A backend Maintenance API-ja
 * részleges (csak start/complete kivezetve, 204-es válaszokkal), ezért a
 * teljes kontraktus MSW-first tükör: a mutációk perzisztálnak a munkameneten
 * belül, a tiltott FSM-átmenetekre a backend guardokkal egyezően 409-et ad.
 */

export interface MaintenanceDb {
  assets: AssetSeed[]
  workOrders: WorkOrder[]
}

function createDb(): MaintenanceDb {
  return {
    assets: seedAssets(),
    workOrders: seedWorkOrders(),
  }
}

let db = createDb()

export function getMaintenanceDb(): MaintenanceDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetMaintenanceDb(): void {
  db = createDb()
}

// ── HTTP helperek (a hrApi/crmApi mintája) ──────────────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a backend WorkOrder aggregátum guardjainak előképe: tiltott
 * átmenet → 409 Conflict a szabálysértést leíró üzenettel. Engedélyezettnél null.
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

/** Napló-időbélyeg a meglévő mock-formátumban (YYYY-MM-DD HH:mm). */
export function logTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

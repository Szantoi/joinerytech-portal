import { HttpResponse } from 'msw'
import { canTransition } from '../../../services/fsmGuards'
import type { FsmRule } from '../../../services/fsmGuards'
import type { CuttingPlan, PriorityProfile } from '../services/plans'
import type { Execution, Milestone, ProgressEvent } from '../services/executions'
import type { CuttingList, DoorOrder } from '../services/orders'
import type { QuoteListItem } from '../services/quotes'
import {
  seedCuttingLists, seedExecutions, seedOrders, seedPlans, seedPriorityProfiles, seedQuotes,
} from './seed'

/**
 * Production mock adatbázis — állapottartó in-memory store az MSW kontraktus-
 * tükörhöz (qa/ehs db.ts minta). A hiba-szemantika VÉGPONTONKÉNT követi a
 * backendet (doksi 1.0/1.5/2.1/2.5):
 *  - cutting planning: FSM-sértés → Result.Invalid → **400**,
 *  - cutting executions: állapot-sértés → **409**, payload-sértés → **422**,
 *  - joinery orders: sértés → **400 validációs tömb** ([{identifier, errorMessage}]
 *    — a doksi 2.1 products-alakjával konzisztens joinery-konvenció),
 *  - quotes (mag-csoport): FSM-sértés → **400**.
 * A guard-feltételek a services/production/fsm.ts KÖZÖS tábláiból jönnek —
 * a UI (disabledReason) és a mock (hibakód) egy igazságforrást használ.
 */

/** Tárolt végrehajtás — a lista-nézet `scheduledAt`-ja + idővonal együtt. */
export interface ExecutionSeed extends Execution {
  scheduledAt: string
  progressEvents: ProgressEvent[]
  milestones: Milestone[]
}

export interface ProductionDb {
  plans: CuttingPlan[]
  priorityProfiles: PriorityProfile[]
  executions: ExecutionSeed[]
  orders: DoorOrder[]
  /** orderId → szabásjegyzék (a calculate és a cutting-list végpont forrása). */
  cuttingLists: Record<string, CuttingList>
  quotes: QuoteListItem[]
  /** Már hozzárendelt batch-ek (assign-batch 409 duplikátum-guard). */
  assignedBatchIds: Set<string>
}

function createDb(): ProductionDb {
  return {
    plans: seedPlans(),
    priorityProfiles: seedPriorityProfiles(),
    executions: seedExecutions(),
    orders: seedOrders(),
    cuttingLists: seedCuttingLists(),
    quotes: seedQuotes(),
    assignedBatchIds: new Set(),
  }
}

let db = createDb()

export function getProductionDb(): ProductionDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetProductionDb(): void {
  db = createDb()
}

// ── HTTP helperek ───────────────────────────────────────────────────────────

/** Cutting-oldali hibatest: `{error, message}` (apiClient-parszolható). */
export function cuttingError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return cuttingError(404, 'NotFound', `${what} nem található`)
}

/** Joinery-oldali validációs tömb (doksi 2.1: `[{identifier, errorMessage}]`). */
export function joineryValidationError(identifier: string, errorMessage: string) {
  return HttpResponse.json([{ identifier, errorMessage }], { status: 400 })
}

/** FSM-sértés üzenete — a UI transitionBlockReason-jével egyező tartalom. */
export function fsmViolationMessage(action: string, status: string): string {
  return `Érvénytelen FSM-átmenet: „${status}" állapotból nem hajtható végre a(z) „${action}" művelet.`
}

/**
 * FSM guard a végpont dokumentált hibakódjával (400 planning/quotes,
 * 409 executions). Engedélyezett átmenetnél null.
 */
export function guardFsm<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
  httpStatus: 400 | 409,
): Response | null {
  if (canTransition(fsm, action, status)) return null
  const error = httpStatus === 409 ? 'Conflict' : 'Invalid'
  return cuttingError(httpStatus, error, fsmViolationMessage(action, status))
}

/** Joinery FSM guard — 400 validációs tömbbel (doksi 2.1). */
export function guardJoineryFsm<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
): Response | null {
  if (canTransition(fsm, action, status)) return null
  return joineryValidationError('status', fsmViolationMessage(action, status))
}

/** Időbélyeg mock-formátumban (perc-pontos ISO, Date-parszolható). */
export function isoTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

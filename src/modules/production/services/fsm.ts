import type { FsmRule } from '../../../services/fsmGuards'
import type {
  CuttingPlanStatus, DoorOrderStatus, ExecutionStatus, QuoteStatus,
} from './wire'

/**
 * Production FSM-tükrök — a backend átmenet-tábláinak KLIENS-oldali másolata
 * (WORLDS_API_CONTRACTS_2026-07-18.md 1.5 + 2.5). EGYETLEN igazságforrás:
 * ugyanezt a táblát használja a UI (Button disabledReason a tiltott
 * átmenetekre) és az MSW kontraktus-tükör (tiltott átmenet → a végpont
 * dokumentált hibakódja). A státusz-kulcsok a MAI wire-alakot hordozzák
 * (angol tagnév-string — wire.ts), a magyar címkék a view-rétegben élnek
 * (pages/labels.ts).
 */

// ── CuttingPlan (planning aggregátum, doksi 1.5) ────────────────────────────
//
// Create → Draft · Publish: Draft→Published (≥1 DaySlot + snapshotId) ·
// Freeze: Published→Frozen (→ inventory offcut-batch regisztráció!) ·
// Close: Frozen→Closed (nincs nyitott DaySlot).
// A PUT /{planId} `UpdateStatus` FSM-bypass (Obsolete) — portálról TILOS.
// Tiltott átmenet a backendben: Result.Invalid → 400 (nem 409!).

export const CUTTING_PLAN_FSM = {
  publish: { from: ['Draft'], to: 'Published' },
  freeze: { from: ['Published'], to: 'Frozen' },
  close: { from: ['Frozen'], to: 'Closed' },
} as const satisfies Record<string, FsmRule<CuttingPlanStatus>>

export type CuttingPlanAction = keyof typeof CUTTING_PLAN_FSM

/** A terv-lánc lineáris — FsmStepperhez. */
export const CUTTING_PLAN_PATH = [
  'Draft', 'Published', 'Frozen', 'Closed',
] as const satisfies readonly CuttingPlanStatus[]

/** „Aktív" (nem lezárt) terv-státuszok — dashboard KPI nevesített guardja. */
export const PLAN_ACTIVE_STATUSES = [
  'Draft', 'Published', 'Frozen',
] as const satisfies readonly CuttingPlanStatus[]

export function isPlanActive(status: CuttingPlanStatus): boolean {
  return (PLAN_ACTIVE_STATUSES as readonly CuttingPlanStatus[]).includes(status)
}

/**
 * Publish FSM-en TÚLI guardja (backend: snapshotId ≠ üres Guid) — a UI
 * (disabledReason) és az MSW (400) közös feltétele.
 */
export function publishSnapshotBlockReason(profileSnapshotId: string): string | undefined {
  if (profileSnapshotId.trim() !== '') return undefined
  return 'A publikáláshoz prioritás-profil pillanatkép (profileSnapshotId) szükséges.'
}

// ── CuttingExecution (doksi 1.5, 6 állapot) ─────────────────────────────────
//
// Schedule → Scheduled · Start: Scheduled→Started (badge-HMAC) ·
// RecordProgress: Started/InProgress→InProgress (esemény-HMAC, idempotens) ·
// Complete: InProgress→Completed (panelsCompleted == totalPanels + proof) ·
// Cancel: nem-terminál→Cancelled.
// ⚠ `Failed`: enum-tag, de NINCS átmenet hozzá a kódban — a UI nem kínál rá
// akciót, csak megjeleníteni tudja (mellékállapot).
// Backend-hibakódok: állapot-sértés → 409, payload-sértés → 422.

export const EXECUTION_FSM = {
  start: { from: ['Scheduled'], to: 'Started' },
  progress: { from: ['Started', 'InProgress'], to: 'InProgress' },
  complete: { from: ['InProgress'], to: 'Completed' },
  cancel: { from: ['Scheduled', 'Started', 'InProgress'], to: 'Cancelled' },
} as const satisfies Record<string, FsmRule<ExecutionStatus>>

export type ExecutionAction = keyof typeof EXECUTION_FSM

/** A fő (sikeres) lánc — FsmStepperhez; Cancelled/Failed mellékállapotok. */
export const EXECUTION_MAIN_PATH = [
  'Scheduled', 'Started', 'InProgress', 'Completed',
] as const satisfies readonly ExecutionStatus[]

/** Futó (nem-terminális) végrehajtás-státuszok — KPI + cancel-guard tükör. */
export const EXECUTION_OPEN_STATUSES = [
  'Scheduled', 'Started', 'InProgress',
] as const satisfies readonly ExecutionStatus[]

export function isExecutionOpen(status: ExecutionStatus): boolean {
  return (EXECUTION_OPEN_STATUSES as readonly ExecutionStatus[]).includes(status)
}

/**
 * Complete FSM-en TÚLI guardja — a backend `panelsCompleted == totalPanels`
 * feltételének tükre. A UI (disabledReason) és az MSW (422) közösen használja.
 */
export function completePanelsBlockReason(
  panelsCompleted: number,
  totalPanels: number,
): string | undefined {
  if (panelsCompleted === totalPanels) return undefined
  return `Csak teljes panel-számmal zárható le (${panelsCompleted}/${totalPanels} kész).`
}

// ── DoorOrder (joinery, doksi 2.5) ──────────────────────────────────────────
//
// Portálról hívható átmenetek: Submit (POST /submit, Draft→Submitted, üres
// tétellista → 400) és RevertToDraft (PUT /revert, CalculationFailed VAGY
// Calculated → Draft). A Calculating/Calculated/CalculationFailed átmeneteket
// az Orchestrator vezérli (MarkCalculating/MarkCalculated/MarkCalculationFailed
// — a portál csak megjeleníti). Tiltott átmenet → 400 (validációs tömb).

export const DOOR_ORDER_FSM = {
  submit: { from: ['Draft'], to: 'Submitted' },
  revert: { from: ['CalculationFailed', 'Calculated'], to: 'Draft' },
  // Backend-vezérelt (Orchestrator) átmenetek — a UI nem kínál rájuk gombot,
  // a tükör a stepper/megjelenítés és az MSW kalkuláció-szimuláció miatt teljes:
  markCalculating: { from: ['Submitted'], to: 'Calculating' },
  markCalculated: { from: ['Calculating'], to: 'Calculated' },
  markCalculationFailed: { from: ['Calculating'], to: 'CalculationFailed' },
} as const satisfies Record<string, FsmRule<DoorOrderStatus>>

export type DoorOrderAction = keyof typeof DOOR_ORDER_FSM

/** A portálról ténylegesen indítható akciók (van átmenet ÉS HTTP-végpont). */
export const DOOR_ORDER_PORTAL_ACTIONS = ['submit', 'revert'] as const satisfies readonly DoorOrderAction[]

/** A fő (sikeres) lánc — FsmStepperhez. */
export const DOOR_ORDER_MAIN_PATH = [
  'Draft', 'Submitted', 'Calculating', 'Calculated',
] as const satisfies readonly DoorOrderStatus[]

/**
 * ⚠ ELÉRHETETLEN állapotok (doksi 2.5 + hiány-lista P6): az enumban léteznek,
 * de a backendben NINCS átmenet hozzájuk. A UI ezeket NEM hazudja elérhetőnek:
 * a stepper gap-szakaszként (disabled + tooltip) jelöli, akciót nem kínál.
 */
export const DOOR_ORDER_UNREACHABLE_STATUSES = [
  'InProduction', 'Completed', 'Cancelled',
] as const satisfies readonly DoorOrderStatus[]

export function isDoorOrderStatusUnreachable(status: DoorOrderStatus): boolean {
  return (DOOR_ORDER_UNREACHABLE_STATUSES as readonly DoorOrderStatus[]).includes(status)
}

/** Aktív (gyártás-előkészítés alatti) rendelés-státuszok — dashboard KPI guard. */
export const DOOR_ORDER_ACTIVE_STATUSES = [
  'Submitted', 'Calculating', 'Calculated',
] as const satisfies readonly DoorOrderStatus[]

export function isDoorOrderActive(status: DoorOrderStatus): boolean {
  return (DOOR_ORDER_ACTIVE_STATUSES as readonly DoorOrderStatus[]).includes(status)
}

/**
 * Submit FSM-en TÚLI guardja — a backend „üres tétellista → 400" tükre.
 * A UI (disabledReason) és az MSW (400) közös feltétele.
 */
export function submitItemsBlockReason(itemCount: number): string | undefined {
  if (itemCount > 0) return undefined
  return 'Üres tétellistával a rendelés nem adható be — vegyél fel legalább egy tételt.'
}

// ── CuttingQuoteRequest (doksi 1.5) ─────────────────────────────────────────
//
// PendingReview → Quoted (PUT /approve) → ConvertedToOrder (publikus track-
// accept, nem portál-akció) · PendingReview → Rejected (PUT /reject).
// Tiltott átmenet a backendben: Result.Invalid → 400 (mag-csoport szemantika).

export const QUOTE_FSM = {
  approve: { from: ['PendingReview'], to: 'Quoted' },
  reject: { from: ['PendingReview'], to: 'Rejected' },
  // Publikus tracking-oldali átmenet (POST /track/{token}/accept) — a portál
  // csak megjeleníti; a tükör az MSW-hez teljes:
  convert: { from: ['Quoted'], to: 'ConvertedToOrder' },
} as const satisfies Record<string, FsmRule<QuoteStatus>>

export type QuoteAction = keyof typeof QUOTE_FSM

/** Döntésre váró ajánlatok — dashboard KPI nevesített guardja. */
export function isQuotePending(status: QuoteStatus): boolean {
  return status === 'PendingReview'
}

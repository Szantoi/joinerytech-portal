/**
 * Production enum-szótárak — a MAI wire-alak EGY helyen (kontraktus-doksi
 * 1.4 + 2.4). ADR-059 wave 2 (EnumWireMap, magyar kanonikus wire-kulcsok)
 * EZT a fájlt fogja cserélni — a modul többi része csak innen importál,
 * inline enum-literál sehol nincs.
 *
 * Wire-szabályok (doksi 0. szekció):
 *  - válasz-oldali enum, ha a DTO stringként hordozza → ANGOL PascalCase tagnév,
 *  - request-oldali enum-typed mező → SZÁM (int ordinal),
 *  - a szabad szöveges mezők (materialType, edgeType…) NEM enumok — nem szűkítjük.
 */

// ── Cutting: CuttingPlan (planning aggregátum) ──────────────────────────────

/** CuttingPlanStatus — string a válaszban (Draft=0..Closed=3). */
export const CUTTING_PLAN_STATUSES = ['Draft', 'Published', 'Frozen', 'Closed'] as const
export type CuttingPlanStatus = (typeof CUTTING_PLAN_STATUSES)[number]

// ── Cutting: CuttingExecution ───────────────────────────────────────────────

/** CuttingExecutionStatus — string az ExecutionDto.status-ban (6 állapot). */
export const EXECUTION_STATUSES = [
  'Scheduled', 'Started', 'InProgress', 'Completed', 'Cancelled', 'Failed',
] as const
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

/** ProgressEventKind — REQUEST-ben SZÁM, válaszban string tagnév. */
export const PROGRESS_EVENT_KIND_WIRE = {
  PanelStarted: 0, PanelCompleted: 1, MaterialLoaded: 2, MachineEvent: 3,
} as const
export type ProgressEventKind = keyof typeof PROGRESS_EVENT_KIND_WIRE

/** ProofLevel — REQUEST-ben SZÁM, válaszban string tagnév. */
export const PROOF_LEVEL_WIRE = {
  HashOnly: 0, SignedEvidence: 1, PhotoEvidence: 2,
} as const
export type ProofLevel = keyof typeof PROOF_LEVEL_WIRE

/** CancelReason — REQUEST-ben SZÁM. */
export const CANCEL_REASON_WIRE = {
  OperatorCancelled: 0, MaterialShortage: 1, MachineFault: 2, SystemCancelled: 3,
} as const
export type CancelReason = keyof typeof CANCEL_REASON_WIRE

/** MilestoneKind / MilestoneStatus — string a válaszban. */
export const MILESTONE_KINDS = [
  'PanelCompletion', 'TimeWindow', 'QualityCheck', 'WorkerConsent',
] as const
export type MilestoneKind = (typeof MILESTONE_KINDS)[number]

export const MILESTONE_STATUSES = ['Pending', 'Met', 'Expired'] as const
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

// ── Cutting: árajánlat (CuttingQuoteRequest) ────────────────────────────────

/** QuoteStatus — string a válaszban. */
export const QUOTE_STATUSES = [
  'PendingReview', 'Quoted', 'ConvertedToOrder', 'Rejected',
] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

// ── Joinery: DoorOrder ──────────────────────────────────────────────────────

/**
 * DoorOrderStatus — string tagnév a DoorOrderDto.status-ban (9 tag).
 * ⚠ `InProduction` / `Completed` / `Cancelled`: az enumban léteznek, de a
 * backendben NINCS átmenet hozzájuk (doksi 2.5) — ld. fsm.ts UNREACHABLE-lista.
 */
export const DOOR_ORDER_STATUSES = [
  'Draft', 'ConfirmedFromSales', 'Submitted', 'Calculating', 'Calculated',
  'CalculationFailed', 'InProduction', 'Completed', 'Cancelled',
] as const
export type DoorOrderStatus = (typeof DOOR_ORDER_STATUSES)[number]

import type { FsmRule } from '../../../services/fsmGuards'

/**
 * Munkalap (WorkOrder) FSM — a backend Maintenance domain TÜKRE
 * (src/maintenance/src/Domain):
 *
 *   WorkOrder aggregátum (akció-guardok)     kanonikus magyar kulcs
 *   ─────────────────────────────────────    ─────────────────────────────
 *   Schedule:  Reported → Scheduled          bejelentve → utemezve
 *   StartWork: Scheduled → InProgress        utemezve → folyamatban
 *   Complete:  InProgress → Completed        folyamatban → kesz (terminális)
 *   Postpone:  Scheduled|InProgress → Postponed   utemezve|folyamatban → halasztva
 *   Reject:    Reported|Scheduled → Rejected      bejelentve|utemezve → elutasitva
 *   Reopen:    Postponed|Rejected → Reported      halasztva|elutasitva → bejelentve
 *
 * MEGJEGYZÉS (backend-gap): a `WorkOrderStatusTransitions` FSM-tábla a
 * Reported → InProgress ugrást is megengedné („if assigned"), de a
 * `WorkOrder.StartWork()` aggregátum-metódus KIZÁRÓLAG Scheduled státuszból
 * indítható — az aggregátum a szigorúbb, ezért ITT az az irányadó
 * (a tábla/aggregátum eltérés follow-up a backend terminálnak).
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre).
 */

// ── Státusz-készlet (kanonikus magyar kulcsok, fsmTones `maintenanceMunkalap`) ─
export type WorkOrderStatus =
  | 'bejelentve' | 'utemezve' | 'folyamatban' | 'kesz' | 'halasztva' | 'elutasitva'

export const WORK_ORDER_FSM = {
  schedule: { from: ['bejelentve'], to: 'utemezve' },
  start: { from: ['utemezve'], to: 'folyamatban' },
  complete: { from: ['folyamatban'], to: 'kesz' },
  postpone: { from: ['utemezve', 'folyamatban'], to: 'halasztva' },
  reject: { from: ['bejelentve', 'utemezve'], to: 'elutasitva' },
  reopen: { from: ['halasztva', 'elutasitva'], to: 'bejelentve' },
} as const satisfies Record<string, FsmRule<WorkOrderStatus>>

export type WorkOrderAction = keyof typeof WORK_ORDER_FSM

/** A fő lánc (nem terminális mellékág) állapotai, sorrendben — FsmStepperhez. */
export const WORK_ORDER_MAIN_PATH_STATUSES = [
  'bejelentve', 'utemezve', 'folyamatban', 'kesz',
] as const satisfies readonly WorkOrderStatus[]

/**
 * Nyitott (aktív) munkalap-státuszok — a dashboard KPI és az eszköz
 * „nyitott munkalapok" számláló közös, nevesített guardja (isOppOpen-minta).
 */
export const WORK_ORDER_OPEN_STATUSES = [
  'bejelentve', 'utemezve', 'folyamatban',
] as const satisfies readonly WorkOrderStatus[]

export function isWorkOrderOpen(status: WorkOrderStatus): boolean {
  return (WORK_ORDER_OPEN_STATUSES as readonly WorkOrderStatus[]).includes(status)
}

/**
 * Felelős-hozzárendelés (Assign) — a backend szerint NEM státusz-átmenet,
 * de státusz-guardja van: csak Reported/Scheduled állapotban engedélyezett
 * (`WorkOrder.AssignInternalTechnician/AssignExternalContractor`).
 * A UI (gomb-guard) és az MSW (409) közös feltétele.
 */
export const WORK_ORDER_ASSIGNABLE_STATUSES = [
  'bejelentve', 'utemezve',
] as const satisfies readonly WorkOrderStatus[]

export function canAssignWorkOrder(status: WorkOrderStatus): boolean {
  return (WORK_ORDER_ASSIGNABLE_STATUSES as readonly WorkOrderStatus[]).includes(status)
}

/** Tiltott hozzárendelés indoka (Button disabledReason), engedélyezettnél undefined. */
export function assignBlockReason(
  status: WorkOrderStatus,
  statusLabels: Record<WorkOrderStatus, string>,
): string | undefined {
  if (canAssignWorkOrder(status)) return undefined
  return `Felelős csak „${statusLabels.bejelentve}" vagy „${statusLabels.utemezve}" státuszban rendelhető hozzá — jelenlegi: „${statusLabels[status]}".`
}

/**
 * A megkezdés (start) FSM-en TÚLI guardja — a backend `StartWork()` tükre:
 * hozzárendelt felelős nélkül a munka nem indítható. A UI (disabledReason)
 * és az MSW (409) közös feltétele.
 */
export function startAssignmentBlockReason(assigneeName: string | null): string | undefined {
  return assigneeName ? undefined : 'A megkezdéshez előbb felelőst kell hozzárendelni a munkalaphoz.'
}

// Guard helperek — közös, modul-független implementáció (services/fsmGuards).
export { canTransition, transitionBlockReason, type FsmRule } from '../../../services/fsmGuards'

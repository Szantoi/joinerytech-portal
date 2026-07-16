import type { FsmRule } from '../../../services/fsmGuards'

/**
 * QA FSM-ek — a backend QA domain TÜKRE (src/qa/src/Domain):
 *
 * 1. Átvizsgálás (Inspection aggregátum + InspectionStatusTransitions):
 *
 *    Akció (aggregátum-metódus)              kanonikus magyar kulcs
 *    ─────────────────────────────────────   ───────────────────────────
 *    Start():            Planned → InProgress            nyitott → folyamatban
 *    CompleteWithPass(): InProgress → Completed+Pass     folyamatban → megfelelt
 *    CompleteWithFail(): InProgress → Completed+Fail     folyamatban → selejt
 *
 *    A backend a státuszt (Planned/InProgress/Completed) és az eredményt
 *    (Pending/Pass/Fail/Conditional) KÜLÖN mezőben tárolja; a kliens-FSM a
 *    kettő összevonását használja kanonikus kulcsként (a theme/fsmTones
 *    `qaEllenorzes` készlete), mert a Completed önmagában nem jeleníthető meg.
 *    A megfelelt/selejt terminális (Completed = immutable audit-trail).
 *
 *    MEGJEGYZÉS (spec↔backend gap): a design-spec `qaEllenorzes` készletében
 *    szereplő `javitasra` (rework-hurok) és a backend `Conditional` eredmény
 *    NEM átvezethető — az aggregátumban nincs rework-átmenet és nincs
 *    CompleteWithConditional metódus. A szigorúbb backend az irányadó
 *    (a Maintenance-lecke mintájára); a feloldás ADR/follow-up.
 *
 * 2. Hibajegy (Ticket aggregátum + TicketStatusTransitions):
 *
 *    Assign():  Reported → Assigned          bejelentve → kiosztva
 *    Start():   Assigned → InProgress        kiosztva → folyamatban
 *    Resolve(): InProgress → Resolved        folyamatban → megoldva (terminális)
 *    Reject():  InProgress → Rejected        folyamatban → elutasitva
 *    Reopen():  Rejected → Reported          elutasitva → bejelentve
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre).
 */

// ═══ Átvizsgálás (Inspection) ═══════════════════════════════════════════════

/** Kanonikus kulcsok (fsmTones `qaEllenorzes`; a spec `javitasra` ága ld. fent). */
export type InspectionStatus = 'nyitott' | 'folyamatban' | 'megfelelt' | 'selejt'

export const INSPECTION_FSM = {
  start: { from: ['nyitott'], to: 'folyamatban' },
  pass: { from: ['folyamatban'], to: 'megfelelt' },
  fail: { from: ['folyamatban'], to: 'selejt' },
} as const satisfies Record<string, FsmRule<InspectionStatus>>

export type InspectionAction = keyof typeof INSPECTION_FSM

/** A fő (sikeres) lánc állapotai sorrendben — FsmStepperhez; a selejt mellékág. */
export const INSPECTION_MAIN_PATH_STATUSES = [
  'nyitott', 'folyamatban', 'megfelelt',
] as const satisfies readonly InspectionStatus[]

/** Nyitott átvizsgálás-státuszok — a dashboard KPI nevesített guardja. */
export const INSPECTION_OPEN_STATUSES = [
  'nyitott', 'folyamatban',
] as const satisfies readonly InspectionStatus[]

export function isInspectionOpen(status: InspectionStatus): boolean {
  return (INSPECTION_OPEN_STATUSES as readonly InspectionStatus[]).includes(status)
}

/** Lezárt (Completed) státuszok — az átvizsgálási arány KPI nevesített guardja. */
export const INSPECTION_DONE_STATUSES = [
  'megfelelt', 'selejt',
] as const satisfies readonly InspectionStatus[]

export function isInspectionDone(status: InspectionStatus): boolean {
  return (INSPECTION_DONE_STATUSES as readonly InspectionStatus[]).includes(status)
}

/**
 * A selejtezés (fail) FSM-en TÚLI guardja — a backend `CompleteWithFail()`
 * tükre: legalább egy hibajegyzet (FailureNote) nélkül nem selejtezhető.
 * A UI (Button disabledReason) és az MSW (400) közös feltétele.
 */
export function failNotesBlockReason(failureNoteCount: number): string | undefined {
  return failureNoteCount > 0
    ? undefined
    : 'A selejtezéshez legalább egy hibajegyzet (hibatípus + leírás) szükséges.'
}

// ═══ Hibajegy (Ticket) ══════════════════════════════════════════════════════

export type TicketStatus =
  | 'bejelentve' | 'kiosztva' | 'folyamatban' | 'megoldva' | 'elutasitva'

export const TICKET_FSM = {
  assign: { from: ['bejelentve'], to: 'kiosztva' },
  start: { from: ['kiosztva'], to: 'folyamatban' },
  resolve: { from: ['folyamatban'], to: 'megoldva' },
  reject: { from: ['folyamatban'], to: 'elutasitva' },
  reopen: { from: ['elutasitva'], to: 'bejelentve' },
} as const satisfies Record<string, FsmRule<TicketStatus>>

export type TicketAction = keyof typeof TICKET_FSM

/** A fő lánc állapotai sorrendben — FsmStepperhez; az elutasitva mellékág. */
export const TICKET_MAIN_PATH_STATUSES = [
  'bejelentve', 'kiosztva', 'folyamatban', 'megoldva',
] as const satisfies readonly TicketStatus[]

/** Nyitott hibajegy-státuszok — a dashboard KPI és az átvizsgálás
 * `openTickets` számlálójának közös, nevesített guardja (isWorkOrderOpen-minta). */
export const TICKET_OPEN_STATUSES = [
  'bejelentve', 'kiosztva', 'folyamatban',
] as const satisfies readonly TicketStatus[]

export function isTicketOpen(status: TicketStatus): boolean {
  return (TICKET_OPEN_STATUSES as readonly TicketStatus[]).includes(status)
}

/**
 * A megoldás (resolve) FSM-en TÚLI guardja — a backend `Resolve()` tükre:
 * legalább egy intézkedés (ResolutionAction) nélkül nem zárható le.
 * A UI (Button disabledReason) és az MSW (400) közös feltétele.
 */
export function resolveActionsBlockReason(actionCount: number): string | undefined {
  return actionCount > 0
    ? undefined
    : 'A megoldáshoz legalább egy intézkedés (típus + leírás) szükséges.'
}

// ── Prioritás-eszkaláció (nem FSM-átmenet, de státusz- és rang-guardolt) ─────

/** A backend CrmTaskPriority (Low/Medium/High/Critical) kanonikus kulcsai. */
export type TicketPriority = 'alacsony' | 'kozepes' | 'magas' | 'kritikus'

/** Az enum-sorrend tükre — az eszkaláció csak FELFELÉ engedélyezett. */
export const TICKET_PRIORITY_RANK: Record<TicketPriority, number> = {
  alacsony: 0, kozepes: 1, magas: 2, kritikus: 3,
}

/**
 * Eszkaláció státusz-guardja — a backend `EscalatePriority()` tükre:
 * terminális (megoldva) hibajegy nem eszkalálható. Engedélyezettnél undefined.
 */
export function escalateStatusBlockReason(status: TicketStatus): string | undefined {
  return status === 'megoldva' ? 'Megoldott hibajegy nem eszkalálható.' : undefined
}

/**
 * Eszkaláció rang-guardja — az új prioritásnak SZIGORÚAN magasabbnak kell
 * lennie a jelenleginél (backend: "New priority must be higher than current").
 */
export function escalatePriorityBlockReason(
  current: TicketPriority,
  next: TicketPriority,
  priorityLabels: Record<TicketPriority, string>,
): string | undefined {
  if (TICKET_PRIORITY_RANK[next] > TICKET_PRIORITY_RANK[current]) return undefined
  return `Az új prioritásnak magasabbnak kell lennie a jelenleginél („${priorityLabels[current]}").`
}

// Guard helperek — közös, modul-független implementáció (services/fsmGuards).
export { canTransition, transitionBlockReason, type FsmRule } from '../../../services/fsmGuards'

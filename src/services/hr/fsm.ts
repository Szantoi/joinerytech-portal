import type { FsmRule } from '../fsmGuards'

/**
 * HR Távollét FSM — a backend HR domain TÜKRE (src/hr/src/Domain):
 *
 *   AbsenceStatusTransitions.cs        kanonikus magyar kulcs (terv 5. pont)
 *   ───────────────────────────       ─────────────────────────────────────
 *   Pending    → Approved|Rejected     kert → jovahagyva | elutasitva
 *   Approved   → InProgress            jovahagyva → folyamatban
 *   InProgress → Completed             folyamatban → lezarva (terminális)
 *   Rejected   → Pending (reopen)      elutasitva → kert
 *
 * Az akció-nevek (approve/reject/start/complete/reopen) a backend
 * Absence aggregátum metódusait/eseményeit tükrözik (AbsenceApprovedEvent…).
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre).
 */

// ── Státusz-készlet (kanonikus magyar kulcsok, fsmTones `hrTavollet`) ────────
export type AbsenceStatus = 'kert' | 'jovahagyva' | 'folyamatban' | 'lezarva' | 'elutasitva'

export const ABSENCE_FSM = {
  approve: { from: ['kert'], to: 'jovahagyva' },
  reject: { from: ['kert'], to: 'elutasitva' },
  start: { from: ['jovahagyva'], to: 'folyamatban' },
  complete: { from: ['folyamatban'], to: 'lezarva' },
  reopen: { from: ['elutasitva'], to: 'kert' },
} as const satisfies Record<string, FsmRule<AbsenceStatus>>

export type AbsenceAction = keyof typeof ABSENCE_FSM

/** A fő lánc (nem terminális mellékág) állapotai, sorrendben — FsmStepperhez. */
export const ABSENCE_MAIN_PATH_STATUSES = [
  'kert', 'jovahagyva', 'folyamatban', 'lezarva',
] as const satisfies readonly AbsenceStatus[]

/**
 * Kapacitást blokkoló státuszok: a jóváhagyott / futó / lezárt távollét
 * kiveszi a napot a kapacitásból; a kért/elutasított NEM (backend
 * CapacityCalculationService-tükör). Nevesített guard (isOppOpen-minta):
 * a UI (kapacitás-rács) és az MSW (kapacitás-válasz) közös feltétele.
 */
export const ABSENCE_BLOCKING_STATUSES = [
  'jovahagyva', 'folyamatban', 'lezarva',
] as const satisfies readonly AbsenceStatus[]

export function isAbsenceBlocking(status: AbsenceStatus): boolean {
  return (ABSENCE_BLOCKING_STATUSES as readonly AbsenceStatus[]).includes(status)
}

/** Döntésre váró (nyitott) kérelem-e — az áttekintés KPI és a per-sor akciók guardja. */
export function isAbsenceRequested(status: AbsenceStatus): boolean {
  return status === 'kert'
}

// Guard helperek — közös, modul-független implementáció (services/fsmGuards).
export { canTransition, transitionBlockReason, type FsmRule } from '../fsmGuards'

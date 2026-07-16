import type { FsmRule } from '../../../services/fsmGuards'

/**
 * CRM FSM-átmenet táblák — a terv-FSM-ek tükre (UI_IMPLEMENTATION_PLAN 5. pont).
 *
 * A backend CRM modul (src/SpaceOS.Modules.CRM) Lead domainje szigorúbb
 * készletet használ (New→Contacted→Qualified→Opportunity, +Disqualified) és
 * NEM tartalmaz nurturing állapotot — a UI-ra a TERV a kanonikus (root-döntés),
 * a backend-gap a task-fájlban dokumentált (F2-CRM-FE).
 *
 * EGYETLEN igazságforrás a kliens oldalon: ugyanezt a táblát használja
 *  - a UI (Button disabledReason a tiltott átmenetekre), és
 *  - az MSW mock (409 Conflict a tiltott átmenetekre).
 */

// ── Státusz-készletek (terv 5. pont — kanonikus magyar kulcsok) ─────────────
export type LeadStatus =
  | 'uj'
  | 'kapcsolat'
  | 'minosites'
  | 'nurturing'
  | 'konvertalva'
  | 'elvetve'

export type OppStatus =
  | 'nyitott'
  | 'igenyfelmeres'
  | 'osszeallitas'
  | 'ajanlat'
  | 'targyalas'
  | 'megnyert'
  | 'elveszett'

/**
 * Lead FSM: uj → kapcsolat → minosites → nurturing → konvertalva (+elvetve).
 * A nurturing opcionális parkolópálya: konvertálni minősítés után közvetlenül
 * és nurturingból is lehet; elvetni bármely nyitott állapotból.
 */
export const LEAD_FSM = {
  contact: { from: ['uj'], to: 'kapcsolat' },
  qualify: { from: ['kapcsolat'], to: 'minosites' },
  nurture: { from: ['minosites'], to: 'nurturing' },
  convert: { from: ['minosites', 'nurturing'], to: 'konvertalva' },
  discard: { from: ['uj', 'kapcsolat', 'minosites', 'nurturing'], to: 'elvetve' },
} as const satisfies Record<string, FsmRule<LeadStatus>>

export type LeadAction = keyof typeof LEAD_FSM

/**
 * Opportunity FSM: nyitott → igenyfelmeres → osszeallitas → ajanlat →
 * targyalas → megnyert | elveszett. Megnyerni csak tárgyalásból lehet
 * (a fő lánc végigjárása kötelező); elveszíteni bármely nyitott fázisból.
 */
export const OPP_FSM = {
  startDiscovery: { from: ['nyitott'], to: 'igenyfelmeres' },
  startProposal: { from: ['igenyfelmeres'], to: 'osszeallitas' },
  sendQuote: { from: ['osszeallitas'], to: 'ajanlat' },
  negotiate: { from: ['ajanlat'], to: 'targyalas' },
  win: { from: ['targyalas'], to: 'megnyert' },
  lose: { from: ['nyitott', 'igenyfelmeres', 'osszeallitas', 'ajanlat', 'targyalas'], to: 'elveszett' },
} as const satisfies Record<string, FsmRule<OppStatus>>

export type OppAction = keyof typeof OPP_FSM

/** A lehetőség fő láncának nyitott (nem terminális) fázisai, sorrendben. */
export const OPP_OPEN_STAGES = [
  'nyitott', 'igenyfelmeres', 'osszeallitas', 'ajanlat', 'targyalas',
] as const satisfies readonly OppStatus[]

/**
 * Nyitott (nem terminális) fázisban van-e a lehetőség. A UI guardja
 * (pl. ajánlat-csonk gomb disabledReason) és az MSW 409-guard közös feltétele.
 */
export function isOppOpen(status: OppStatus): boolean {
  return (OPP_OPEN_STAGES as readonly OppStatus[]).includes(status)
}

/** A lead nyitott (nem terminális) állapotai. */
export const LEAD_OPEN_STATUSES = [
  'uj', 'kapcsolat', 'minosites', 'nurturing',
] as const satisfies readonly LeadStatus[]

/**
 * Fázisonkénti győzelmi valószínűség (súlyozott forecast alapja).
 * A backend-kontraktus rögzítéséig itt (configban) él, nem a komponensekben.
 */
export const OPP_STAGE_PROBABILITY: Record<OppStatus, number> = {
  nyitott: 0.10,
  igenyfelmeres: 0.25,
  osszeallitas: 0.40,
  ajanlat: 0.55,
  targyalas: 0.80,
  megnyert: 1,
  elveszett: 0,
}

/** Súlyozott (valószínűséggel szorzott) érték. */
export function weightedValue(value: number, status: OppStatus): number {
  return Math.round(value * OPP_STAGE_PROBABILITY[status])
}

/**
 * A fő lánc következő lépés-akciója az adott fázisból (kanban „léptetés" gomb).
 * Terminális állapotból nincs következő akció.
 */
export function nextOppAction(status: OppStatus): OppAction | undefined {
  const entry = (Object.entries(OPP_FSM) as [OppAction, FsmRule<OppStatus>][]).find(
    ([action, rule]) => action !== 'lose' && rule.from.includes(status),
  )
  return entry?.[0]
}

// Guard helperek — közös, modul-független implementáció (services/fsmGuards).
export { canTransition, transitionBlockReason, type FsmRule } from '../../../services/fsmGuards'

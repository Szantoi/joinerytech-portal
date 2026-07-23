/**
 * FSM_TONES — a 7 platform-modul FSM státusz-készleteinek → tónus térképe.
 *
 * Forrás: docs/knowledge/patterns/DESIGN_SYSTEM_SPEC_V1.md, 1.5 fejezet
 * (a master plan 5. pontjának kötelező státusz-készletei, kanonikus kulcsokkal).
 *
 * A frontend EZT a térképet importálja; ismeretlen státusz → `neutral` + dev-warning.
 * A portál jelenlegi (átmenetileg angol) enum-kulcsait a FSM_STATUS_ALIASES
 * fordítja kanonikusra, amíg az enum-kanonizáció (root-döntés) meg nem történik.
 */

import type { Tone } from './statusTones'

export const FSM_TONES = {
  crmLead: {
    uj: 'neutral', kapcsolat: 'info', minosites: 'progress',
    nurturing: 'warn', konvertalva: 'success', elvetve: 'terminal',
  },
  crmOpportunity: {
    nyitott: 'neutral', igenyfelmeres: 'info', osszeallitas: 'progress',
    ajanlat: 'progress', targyalas: 'warn',
    megnyert: 'success', elveszett: 'terminal',
  },
  hrTavollet: {
    kert: 'warn',            // döntésre vár
    jovahagyva: 'info', folyamatban: 'progress',
    lezarva: 'terminal', elutasitva: 'danger',
  },
  maintenanceMunkalap: {
    bejelentve: 'neutral', utemezve: 'info', folyamatban: 'progress',
    kesz: 'success', halasztva: 'warn', elutasitva: 'terminal',
    // eszköz-státusz SZÁMÍTOTT — a munkalapokból derivált, külön pill nem kap FSM-akciót
  },
  qaEllenorzes: {
    nyitott: 'neutral', folyamatban: 'progress', megfelelt: 'success',
    javitasra: 'warn',       // rework-hurok
    selejt: 'danger',        // terminális, de danger tónus — kiemelt negatív
  },
  ehsBaleset: {
    bejelentve: 'danger',    // friss incidens = azonnali figyelem
    kivizsgalas: 'warn', intezkedes: 'progress',
    lezarva: 'success', elutasitva: 'terminal',
  },
  /** EVE/PPE kiadás (EHS backend-kontraktus): kiadva → atvett → visszavett | cserelve */
  ehsPpeKiadas: {
    kiadva: 'warn',          // átvételre vár
    atvett: 'success',       // használatban, rendben
    visszavett: 'terminal', cserelve: 'terminal',
  },
  /** Munkavédelmi bejárás (EHS backend-kontraktus): utemezett → folyamatban → intezkedes → lezart (+elmaradt) */
  ehsBejaras: {
    utemezett: 'info', folyamatban: 'progress',
    intezkedes: 'warn',      // nyitott CAPA-k, figyelmet igényel
    lezart: 'success', elmaradt: 'terminal',
  },
  /** Kockázatértékelés — ADR-059 kanonikus magyar wire-kulcsok. */
  ehsKockazat: {
    piszkozat: 'neutral', ellenorzes: 'warn',
    jovahagyva: 'success', archivalt: 'terminal',
  },
  dmsDokumentum: {
    piszkozat: 'neutral', ellenorzes: 'warn',
    kiadott: 'success', archivalt: 'terminal',
  },
  kontrollingProjekt: {    // címkék, nem szigorú FSM
    draft: 'neutral', active: 'progress', install: 'info',
    done: 'success', on_hold: 'warn',
  },
} satisfies Record<string, Record<string, Tone>>

/** A platform FSM státusz-készleteinek azonosítói. */
export type FsmSet = keyof typeof FSM_TONES

/**
 * ÁTMENETI: a portál jelenlegi (angol) enum-kulcsai → kanonikus FSM-kulcsok.
 * Az UI_GAP_ANALYSIS 7.2 szerinti enum-nyelvi kettősség feloldásáig él;
 * az enum-átnevezés után törölhető.
 */
export const FSM_STATUS_ALIASES: Partial<Record<FsmSet, Record<string, string>>> = {
  maintenanceMunkalap: {
    open: 'bejelentve', scheduled: 'utemezve', in_progress: 'folyamatban',
    done: 'kesz', deferred: 'halasztva',
  },
  qaEllenorzes: {
    open: 'nyitott', under_review: 'folyamatban', closed: 'megfelelt',
  },
  ehsBaleset: {
    reported: 'bejelentve', investigating: 'kivizsgalas',
    action: 'intezkedes', closed: 'lezarva',
    // EHS backend-kontraktus (openapi IncidentStatus) enum-kulcsai:
    Reported: 'bejelentve', Investigated: 'kivizsgalas',
    CorrectiveActionPlanned: 'intezkedes', Closed: 'lezarva',
  },
  // EHS backend-kontraktus enum-kulcsok → kanonikus magyar kulcsok
  ehsPpeKiadas: {
    Issued: 'kiadva', Acknowledged: 'atvett',
    Returned: 'visszavett', Replaced: 'cserelve',
  },
  ehsBejaras: {
    Scheduled: 'utemezett', InProgress: 'folyamatban',
    ActionRequired: 'intezkedes', Closed: 'lezart', Cancelled: 'elmaradt',
  },
}

/**
 * ÁTMENETI: portál-státuszok, amelyeknek (még) nincs kanonikus FSM-megfelelője.
 * A QA `rejected` (visszautasított NCR) lezárt végállapot → terminal tónus.
 */
export const FSM_EXTRA_TONES: Partial<Record<FsmSet, Record<string, Tone>>> = {
  qaEllenorzes: { rejected: 'terminal' },
  // A backend Reopened állapota (Closed → Reopened) nincs a terv-FSM-ben —
  // újranyitott esemény döntést vár → warn.
  ehsBaleset: { Reopened: 'warn' },
}

/**
 * Egy FSM-készlet státuszának feloldása tónusra.
 * Sorrend: kanonikus kulcs → alias → extra; ismeretlen → `neutral` + dev-warning.
 */
export function resolveFsmTone(set: FsmSet, status: string): Tone {
  const tones: Record<string, Tone> = FSM_TONES[set]
  const direct = tones[status]
  if (direct) return direct

  const alias = FSM_STATUS_ALIASES[set]?.[status]
  if (alias && tones[alias]) return tones[alias]

  const extra = FSM_EXTRA_TONES[set]?.[status]
  if (extra) return extra

  if (import.meta.env.DEV) {
    console.warn(`[fsmTones] Ismeretlen státusz "${status}" a(z) "${set}" FSM-készletben — neutral tónus lesz`)
  }
  return 'neutral'
}

import { LEADS, OPPS, CRM_TASKS } from '../worlds'
import type { Lead } from '../../services/crm/leads'
import type { Opportunity } from '../../services/crm/opportunities'
import type { CrmTask } from '../../services/crm/tasks'

/**
 * CRM mock seed — a meglévő statikus mock-adatokat (mocks/worlds.ts) tölti be
 * az állapottartó store-ba (adat-újrahasznosítás, nem másolat). A feladat-
 * határidők a „most"-hoz képest relatívak, így az SLA-számítás
 * (ok/soon/overdue) minden futásnál determinisztikus.
 */

/** Napokkal eltolt dátum (YYYY-MM-DD; negatív = múlt). */
export function dueInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const CRM_SEED_IDS = {
  leadNew: 'LEAD-2426-001',        // uj
  leadContacted: 'LEAD-2426-002',  // kapcsolat
  leadQualified: 'LEAD-2426-003',  // minosites
  leadNurturing: 'LEAD-2426-004',  // nurturing
  leadDiscarded: 'LEAD-2426-005',  // elvetve
  leadConverted: 'LEAD-2426-006',  // konvertalva

  oppOpen: 'OPP-2426-001',         // nyitott
  oppDiscovery: 'OPP-2426-002',    // igenyfelmeres
  oppQuoted: 'OPP-2426-003',       // ajanlat (quoteId-val)
  oppNegotiation: 'OPP-2426-004',  // targyalas
  oppWon: 'OPP-2426-005',          // megnyert
  oppLost: 'OPP-2426-006',         // elveszett

  taskSoon: 'CRMT-001',
  taskOverdue: 'CRMT-002',
  taskOk: 'CRMT-005',
  taskDone: 'CRMT-006',
} as const

/**
 * Relatív feladat-határidők: 2 lejárt (SLA-sértés), 1 hamarosan esedékes,
 * 2 rendben, 1 teljesítve — az áttekintés KPI-jai ebből számolhatók.
 */
const TASK_DUE_OFFSETS: Record<string, number> = {
  'CRMT-001': 1,    // soon (TASK_SLA_SOON_DAYS=2 ablakon belül)
  'CRMT-002': -2,   // overdue
  'CRMT-003': -1,   // overdue
  'CRMT-004': 45,   // ok
  'CRMT-005': 10,   // ok
  'CRMT-006': -20,  // done — az SLA nem számít
}

export function seedLeads(): Lead[] {
  return structuredClone(LEADS) as Lead[]
}

export function seedOpps(): Opportunity[] {
  return structuredClone(OPPS) as Opportunity[]
}

export function seedTasks(): CrmTask[] {
  return structuredClone(CRM_TASKS).map((t) => ({
    ...t,
    due: dueInDays(TASK_DUE_OFFSETS[t.id] ?? 7),
  })) as CrmTask[]
}

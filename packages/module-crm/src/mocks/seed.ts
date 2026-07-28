import type { Lead } from '../services/leads'
import type { Opportunity } from '../services/opportunities'
import type { CrmTask } from '../services/tasks'
import { CRM_LEAD_FIXTURES, CRM_OPPORTUNITY_FIXTURES, CRM_TASK_FIXTURES } from './fixtures'

/**
 * CRM mock seed — a modul-saját, kanonikus API-alakú fixture-eket tölti be
 * az állapottartó store-ba. A feladat-
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
  return structuredClone(CRM_LEAD_FIXTURES)
}

export function seedOpps(): Opportunity[] {
  return structuredClone(CRM_OPPORTUNITY_FIXTURES)
}

export function seedTasks(): CrmTask[] {
  return structuredClone(CRM_TASK_FIXTURES).map((t) => ({
    ...t,
    due: dueInDays(TASK_DUE_OFFSETS[t.id] ?? 7),
  })) as CrmTask[]
}

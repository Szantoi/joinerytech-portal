import type { Tone } from '../../theme/statusTones'
import { parseDay } from '../../services/dateUtils'
import type { LeadAction, LeadStatus, OppAction, OppStatus } from '../../services/crm/fsm'
import type { ActivityKind } from '../../services/crm/activities'
import type { CrmSource } from '../../services/crm/leads'
import type { TaskPriority } from '../../services/crm/tasks'
import type { TaskSla } from '../../services/crm/sla'

/**
 * CRM UI címke-térképek — a kanonikus státusz-kulcsok magyar megjelenítése.
 * A pill-tónusok a theme/fsmTones.ts FSM-készleteiből jönnek (crmLead,
 * crmOpportunity); itt csak a látható szöveg és a nem-FSM tónusok élnek.
 */

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  uj: 'Új',
  kapcsolat: 'Kapcsolatfelvétel',
  minosites: 'Minősítés',
  nurturing: 'Nurturing',
  konvertalva: 'Konvertálva',
  elvetve: 'Elvetve',
}

export const OPP_STATUS_LABELS: Record<OppStatus, string> = {
  nyitott: 'Nyitott',
  igenyfelmeres: 'Igényfelmérés',
  osszeallitas: 'Összeállítás',
  ajanlat: 'Ajánlat kiküldve',
  targyalas: 'Tárgyalás',
  megnyert: 'Megnyert',
  elveszett: 'Elveszett',
}

export const LEAD_ACTION_LABELS: Record<LeadAction, string> = {
  contact: 'Kapcsolatfelvétel',
  qualify: 'Minősítés',
  nurture: 'Nurturingbe',
  convert: 'Konvertálás lehetőséggé',
  discard: 'Elvetés',
}

export const OPP_ACTION_LABELS: Record<OppAction, string> = {
  startDiscovery: 'Igényfelmérés indítása',
  startProposal: 'Összeállítás indítása',
  sendQuote: 'Ajánlat kiküldése',
  negotiate: 'Tárgyalás indítása',
  win: 'Megnyert',
  lose: 'Elveszett',
}

/** A lead-FSM fő útja a stepperhez (az elvetve mellékállapot). */
export const LEAD_MAIN_PATH: { key: LeadStatus; label: string }[] = [
  { key: 'uj', label: LEAD_STATUS_LABELS.uj },
  { key: 'kapcsolat', label: LEAD_STATUS_LABELS.kapcsolat },
  { key: 'minosites', label: LEAD_STATUS_LABELS.minosites },
  { key: 'nurturing', label: LEAD_STATUS_LABELS.nurturing },
  { key: 'konvertalva', label: LEAD_STATUS_LABELS.konvertalva },
]

/** A lehetőség-FSM fő útja a stepperhez (az elveszett mellékállapot). */
export const OPP_MAIN_PATH: { key: OppStatus; label: string }[] = [
  { key: 'nyitott', label: OPP_STATUS_LABELS.nyitott },
  { key: 'igenyfelmeres', label: OPP_STATUS_LABELS.igenyfelmeres },
  { key: 'osszeallitas', label: OPP_STATUS_LABELS.osszeallitas },
  { key: 'ajanlat', label: OPP_STATUS_LABELS.ajanlat },
  { key: 'targyalas', label: OPP_STATUS_LABELS.targyalas },
  { key: 'megnyert', label: OPP_STATUS_LABELS.megnyert },
]

export const SOURCE_LABELS: Record<CrmSource, string> = {
  telefon: 'Telefon',
  ajanlas: 'Ajánlás',
  email: 'Email',
  kiallitas: 'Kiállítás',
  weboldal: 'Weboldal',
  webshop: 'Webshop',
  belsoepitesz: 'Belsőépítész',
}

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  hivas: 'Hívás',
  email: 'Email',
  talalkozo: 'Találkozó',
  megjegyzes: 'Megjegyzés',
}

export const PRIORITY_META: Record<TaskPriority, { label: string; tone: Tone }> = {
  magas: { label: 'Magas', tone: 'danger' },
  kozepes: { label: 'Közepes', tone: 'warn' },
  alacsony: { label: 'Alacsony', tone: 'neutral' },
}

/** SZÁMÍTOTT feladat-SLA → címke + tónus (StatusPill: ok/soon/overdue). */
export const SLA_META: Record<TaskSla, { label: string; tone: Tone }> = {
  ok: { label: 'Határidőn belül', tone: 'success' },
  soon: { label: 'Hamarosan esedékes', tone: 'warn' },
  overdue: { label: 'Késésben', tone: 'danger' },
}

// ── Formázók ────────────────────────────────────────────────────────────────

/** Ft-összeg tömör megjelenítése (M Ft / eFt). */
export function formatMoney(n: number): string {
  n = Number(n) || 0
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' M Ft'
  if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + ' eFt'
  return n + ' Ft'
}

/** Dátum — a nap-kulcsot a HELYI idejű parseDay bontja (NE `new Date(iso)`: UTC-csapda). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseDay(iso).toLocaleDateString('hu-HU')
}

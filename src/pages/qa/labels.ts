import type { Tone } from '../../theme/statusTones'
import {
  PASS_RATE_WARN_THRESHOLD,
  type CriticalLevel, type InspectionAction, type InspectionStatus,
  type TicketAction, type TicketPriority, type TicketStatus,
} from '../../services/qa'
import type {
  CheckpointType, CriteriaType, FailureType,
} from '../../services/qa/inspections'
import type { ResolutionActionType, TicketType } from '../../services/qa/tickets'

/**
 * QA UI címke-térképek — a kanonikus státusz-kulcsok magyar megjelenítése.
 * Az átvizsgálás-pill tónusok a theme/fsmTones.ts `qaEllenorzes` készletéből
 * jönnek; a hibajegy-státuszokra a spec 1.5 (még) nem definiál FSM-készletet,
 * ezért azok tónusai ITT élnek lokális Tone-térképként (az ASSET_STATUS_META
 * precedens) — a spec-be emelésük designer follow-up.
 */

// ── Átvizsgálás (Inspection) ────────────────────────────────────────────────

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  nyitott: 'Nyitott',
  folyamatban: 'Folyamatban',
  megfelelt: 'Megfelelt',
  selejt: 'Selejt',
}

export const INSPECTION_ACTION_LABELS: Record<InspectionAction, string> = {
  start: 'Megkezdés',
  pass: 'Megfelelt — lezárás',
  fail: 'Selejtezés',
}

/** Az átvizsgálás-FSM fő (sikeres) útja a stepperhez (selejt mellékállapot). */
export const INSPECTION_MAIN_PATH: { key: InspectionStatus; label: string }[] = [
  { key: 'nyitott', label: INSPECTION_STATUS_LABELS.nyitott },
  { key: 'folyamatban', label: INSPECTION_STATUS_LABELS.folyamatban },
  { key: 'megfelelt', label: INSPECTION_STATUS_LABELS.megfelelt },
]

export const CHECKPOINT_TYPE_META: Record<CheckpointType, { label: string; tone: Tone }> = {
  beerkezo: { label: 'Beérkező', tone: 'info' },
  gyartaskozi: { label: 'Gyártásközi', tone: 'progress' },
  vegso: { label: 'Végső', tone: 'neutral' },
}

export const CRITICAL_LEVEL_META: Record<CriticalLevel, { label: string; tone: Tone }> = {
  kritikus: { label: 'Kritikus pont', tone: 'danger' },
  jelentos: { label: 'Jelentős pont', tone: 'warn' },
  enyhe: { label: 'Enyhe pont', tone: 'info' },
}

export const CRITERIA_TYPE_LABELS: Record<CriteriaType, string> = {
  vizualis: 'Vizuális',
  meretes: 'Méretes',
  funkcionalis: 'Funkcionális',
}

/** A backend FailureType enum (10 érték) magyar címkéi. */
export const FAILURE_TYPE_LABELS: Record<FailureType, string> = {
  karc: 'Karcolás',
  hezag: 'Hézag',
  illeszkedes: 'Illeszkedés',
  szin: 'Színeltérés',
  meret: 'Mérethiba',
  felulet: 'Felületi hiba',
  funkcionalis: 'Funkcionális hiba',
  hianyzo: 'Hiányzó elem',
  serules: 'Sérülés',
  egyeb: 'Egyéb',
}

// ── Hibajegy (Ticket) ───────────────────────────────────────────────────────

/** Hibajegy-státusz → címke + tónus (lokális Tone-térkép, ld. fejléc-komment). */
export const TICKET_STATUS_META: Record<TicketStatus, { label: string; tone: Tone }> = {
  bejelentve: { label: 'Bejelentve', tone: 'neutral' },
  kiosztva: { label: 'Kiosztva', tone: 'info' },
  folyamatban: { label: 'Folyamatban', tone: 'progress' },
  megoldva: { label: 'Megoldva', tone: 'success' },
  elutasitva: { label: 'Elutasítva', tone: 'terminal' },
}

/** Csak a látható címkék (a transitionBlockReason guard-üzeneteihez). */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  bejelentve: TICKET_STATUS_META.bejelentve.label,
  kiosztva: TICKET_STATUS_META.kiosztva.label,
  folyamatban: TICKET_STATUS_META.folyamatban.label,
  megoldva: TICKET_STATUS_META.megoldva.label,
  elutasitva: TICKET_STATUS_META.elutasitva.label,
}

export const TICKET_ACTION_LABELS: Record<TicketAction, string> = {
  assign: 'Kiosztás',
  start: 'Megkezdés',
  resolve: 'Megoldás',
  reject: 'Elutasítás',
  reopen: 'Újranyitás',
}

/** A hibajegy-FSM fő útja a stepperhez (elutasitva mellékállapot). */
export const TICKET_MAIN_PATH: { key: TicketStatus; label: string }[] = [
  { key: 'bejelentve', label: TICKET_STATUS_META.bejelentve.label },
  { key: 'kiosztva', label: TICKET_STATUS_META.kiosztva.label },
  { key: 'folyamatban', label: TICKET_STATUS_META.folyamatban.label },
  { key: 'megoldva', label: TICKET_STATUS_META.megoldva.label },
]

export const TICKET_TYPE_META: Record<TicketType, { label: string; tone: Tone }> = {
  garancia: { label: 'Garancia', tone: 'info' },
  javitas: { label: 'Javítás', tone: 'warn' },
  hiany: { label: 'Hiányzó tétel', tone: 'neutral' },
}

/** Prioritás (súlyosság) → címke + tónus — a Maintenance WO_PRIORITY_META mintája. */
export const TICKET_PRIORITY_META: Record<TicketPriority, { label: string; tone: Tone }> = {
  kritikus: { label: 'Kritikus', tone: 'danger' },
  magas: { label: 'Magas', tone: 'warn' },
  kozepes: { label: 'Közepes', tone: 'info' },
  alacsony: { label: 'Alacsony', tone: 'neutral' },
}

/** Prioritás-sorrend a listákhoz/eloszláshoz (kritikus elöl) — enum-sorrend tükre. */
export const TICKET_PRIORITY_ORDER: TicketPriority[] = [
  'kritikus', 'magas', 'kozepes', 'alacsony',
]

export const ACTION_TYPE_LABELS: Record<ResolutionActionType, string> = {
  javitas: 'Javítás',
  csere: 'Csere',
  visszaterites: 'Visszatérítés',
  nincs_intezkedes: 'Nincs intézkedés',
}

/** A megfelelési KPI alcíme — a config-küszöbből SZÁMÍTVA (HR-review M1-lecke). */
export const PASS_RATE_TARGET_LABEL = `cél: legalább ${PASS_RATE_WARN_THRESHOLD}%`

// ── Formázók ────────────────────────────────────────────────────────────────

/** Dátum (a mock-időbélyegek YYYY-MM-DDTHH:mm formátumúak). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('hu-HU')
}

/** Dátum + idő (napló-jellegű mezőkhöz). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${new Date(iso).toLocaleDateString('hu-HU')} ${iso.slice(11, 16)}`
}

/** Százalék; null (nincs adat) → „—". */
export function formatPct(value: number | null): string {
  return value === null ? '—' : `${value}%`
}

/** Órák tömören („174 ó"), null → „—". */
export function formatHours(hours: number | null): string {
  return hours === null ? '—' : `${Math.round(hours)} ó`
}

/** Forint ezres tagolással. */
export function formatHuf(amount: number): string {
  return `${amount.toLocaleString('hu-HU')} Ft`
}

/** Rövid hét-címke a trend-sorokhoz: „7.06 hete". */
export function formatWeekLabel(weekStartIso: string): string {
  const [, m, d] = weekStartIso.split('-').map(Number)
  return `${m}.${String(d).padStart(2, '0')}. hete`
}

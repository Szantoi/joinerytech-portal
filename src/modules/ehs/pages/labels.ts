import type { Tone } from '../../../theme/statusTones'
import type { IncidentStatus, PpeIssuanceStatus, SafetyWalkStatus } from '../services/fsm'
import type { IncidentType } from '../services/incidents'
import type { SdsValidity } from '../services/validity'
import type { MaterialStatus } from '../services/materials'
import type { PpeCategory } from '../services/ppe'
import type { FindingSeverity } from '../services/safetyWalks'
import type { CapaSource } from '../services/capa'

/**
 * EHS UI címke-térképek — a backend enum-kulcsok magyar megjelenítése.
 * A pill-tónusok a theme/fsmTones.ts FSM-készleteiből jönnek (ehsBaleset,
 * ehsPpeKiadas, ehsBejaras); itt csak a látható szöveg és a nem-FSM tónusok élnek.
 */

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  Reported: 'Bejelentve',
  Investigated: 'Kivizsgálás',
  CorrectiveActionPlanned: 'Intézkedés',
  Closed: 'Lezárva',
  Reopened: 'Újranyitva',
}

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  Accident: 'Baleset',
  NearMiss: 'Kvázibaleset',
  HazardousCondition: 'Veszélyes állapot',
}

/** 1–5 súlyosság (openapi: 1=Negligible … 5=Catastrophic). */
export const SEVERITY_LABELS: Record<number, { label: string; tone: Tone }> = {
  1: { label: 'Elhanyagolható', tone: 'neutral' },
  2: { label: 'Kisebb', tone: 'info' },
  3: { label: 'Közepes', tone: 'warn' },
  4: { label: 'Súlyos', tone: 'danger' },
  5: { label: 'Katasztrofális', tone: 'danger' },
}

/** SZÁMÍTOTT SDS érvényesség → címke + tónus (task 4a: valid=success, expiring=warn, expired=danger). */
export const SDS_VALIDITY_META: Record<SdsValidity, { label: string; tone: Tone }> = {
  Valid: { label: 'Érvényes', tone: 'success' },
  Expiring: { label: 'Lejáróban', tone: 'warn' },
  Expired: { label: 'Lejárt', tone: 'danger' },
}

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  Active: 'Aktív',
  Archived: 'Archivált',
}

export const PPE_STATUS_LABELS: Record<PpeIssuanceStatus, string> = {
  Issued: 'Kiadva',
  Acknowledged: 'Átvett',
  Returned: 'Visszavett',
  Replaced: 'Cserélve',
}

export const PPE_CATEGORY_LABELS: Record<PpeCategory, string> = {
  Head: 'Fejvédelem',
  Eye: 'Szemvédelem',
  Hearing: 'Hallásvédelem',
  Respiratory: 'Légzésvédelem',
  Hand: 'Kézvédelem',
  Foot: 'Lábvédelem',
  Body: 'Testvédelem',
  Fall: 'Leesés elleni védelem',
}

export const WALK_STATUS_LABELS: Record<SafetyWalkStatus, string> = {
  Scheduled: 'Ütemezett',
  InProgress: 'Folyamatban',
  ActionRequired: 'Intézkedés',
  Closed: 'Lezárt',
  Cancelled: 'Elmaradt',
}

/** A bejárás-FSM fő útja a stepperhez (a Cancelled mellékállapot). */
export const WALK_MAIN_PATH: { key: SafetyWalkStatus; label: string }[] = [
  { key: 'Scheduled', label: WALK_STATUS_LABELS.Scheduled },
  { key: 'InProgress', label: WALK_STATUS_LABELS.InProgress },
  { key: 'ActionRequired', label: WALK_STATUS_LABELS.ActionRequired },
  { key: 'Closed', label: WALK_STATUS_LABELS.Closed },
]

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, { label: string; tone: Tone }> = {
  Negligible: { label: 'Elhanyagolható', tone: 'neutral' },
  Minor: { label: 'Kisebb', tone: 'info' },
  Moderate: { label: 'Közepes', tone: 'warn' },
  Major: { label: 'Súlyos', tone: 'danger' },
  Catastrophic: { label: 'Katasztrofális', tone: 'danger' },
}

export const CAPA_SOURCE_LABELS: Record<CapaSource, string> = {
  esemeny: 'Esemény',
  bejaras: 'Bejárás',
  kockazatertekeles: 'Kockázat',
}

// ── Dátum-megjelenítés ──────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('hu-HU')
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })
}

/** Lejárt határidő? (CAPA táblán a lejárt határidő danger-kiemelést kap.) */
export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now()
}

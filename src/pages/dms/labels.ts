import type { Tone } from '../../theme/statusTones'
import {
  EXPIRY_WARN_DAYS, parseDay,
  type DocLinkType, type DocType, type DocumentAction, type DocumentStatus,
  type ExpiryState,
} from '../../services/dms'

/**
 * DMS UI címke-térképek — a kanonikus státusz-kulcsok magyar megjelenítése.
 * A dokumentum-pill tónusok a theme/fsmTones.ts `dmsDokumentum` készletéből
 * jönnek (StatusPill fsm-prop); a típus/kapcsolat/lejárat tónusai ITT élnek
 * lokális Tone-térképként (a QA CHECKPOINT_TYPE_META precedens).
 */

// ── Dokumentum-státusz és FSM-akciók ────────────────────────────────────────

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  piszkozat: 'Piszkozat',
  ellenorzes: 'Ellenőrzés',
  kiadott: 'Kiadott',
  archivalt: 'Archivált',
}

export const DOCUMENT_ACTION_LABELS: Record<DocumentAction, string> = {
  submit: 'Ellenőrzésre küldés',
  approve: 'Jóváhagyás — kiadás',
  reject: 'Visszautasítás',
  recall: 'Felülvizsgálat',
  archive: 'Archiválás',
  reopen: 'Újranyitás',
}

/** A jóváhagyási fő út a stepperhez (archivalt mellékállapot). */
export const DOCUMENT_MAIN_PATH: { key: DocumentStatus; label: string }[] = [
  { key: 'piszkozat', label: DOCUMENT_STATUS_LABELS.piszkozat },
  { key: 'ellenorzes', label: DOCUMENT_STATUS_LABELS.ellenorzes },
  { key: 'kiadott', label: DOCUMENT_STATUS_LABELS.kiadott },
]

// ── Típus / kapcsolat / lejárat ─────────────────────────────────────────────

/** Dokumentum-típus → címke + tónus (a prototípus DOC_TYPE_META tükre). */
export const DOC_TYPE_META: Record<DocType, { label: string; tone: Tone }> = {
  rajz: { label: 'Műszaki rajz', tone: 'info' },
  szerzodes: { label: 'Szerződés', tone: 'progress' },
  tanusitvany: { label: 'Tanúsítvány', tone: 'success' },
  utasitas: { label: 'Munkautasítás', tone: 'warn' },
  egyeb: { label: 'Egyéb', tone: 'neutral' },
}

/** Típus-sorrend a szűrő-chipekhez (a prototípus DOC_TYPE_ORDER tükre). */
export const DOC_TYPE_ORDER: DocType[] = ['rajz', 'szerzodes', 'tanusitvany', 'utasitas', 'egyeb']

/** Kapcsolat-mappa (mihez tartozik) — a prototípus DOC_LINK_META tükre. */
export const DOC_LINK_LABELS: Record<DocLinkType, string> = {
  project: 'Projekt',
  order: 'Rendelés',
  catalog: 'Cikkszám',
  template: 'Sablon',
  customer: 'Ügyfél',
  none: 'Általános',
}

export const DOC_LINK_ORDER: DocLinkType[] = [
  'project', 'order', 'catalog', 'template', 'customer', 'none',
]

/** Lejárat-állapot → címke + tónus (a SZÁMÍTOTT `expiry` mező megjelenítése). */
export const EXPIRY_META: Record<ExpiryState, { label: string; tone: Tone }> = {
  lejart: { label: 'Lejárt', tone: 'danger' },
  lejaro: { label: 'Hamarosan lejár', tone: 'warn' },
}

/** A lejáró-nézet alcíme — a config-küszöbből SZÁMÍTVA (HR-review M1-lecke). */
export const EXPIRY_WINDOW_LABEL = `${EXPIRY_WARN_DAYS} napos ablak`

// ── Formázók ────────────────────────────────────────────────────────────────

/**
 * Dátum (a mock-időbélyegek YYYY-MM-DD[THH:mm] formátumúak) — a nap-részt a
 * helyi-idejű parseDay bontja (NE `new Date(iso)`: dátum-only stringnél
 * UTC-csapda — review-lecke).
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseDay(iso).toLocaleDateString('hu-HU')
}

/** Dátum + idő (verzió-lánc bejegyzésekhez). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${formatDate(iso)} ${iso.slice(11, 16)}`
}

/** Hátralévő/eltelt napok szövege a lejárathoz („12 nap múlva" / „10 napja lejárt"). */
export function formatExpiryDays(days: number | null): string {
  if (days === null) return '—'
  if (days < 0) return `${-days} napja lejárt`
  if (days === 0) return 'ma jár le'
  return `${days} nap múlva`
}

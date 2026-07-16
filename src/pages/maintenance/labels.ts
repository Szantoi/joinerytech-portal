import type { Tone } from '../../theme/statusTones'
import {
  PLAN_DUE_SOON_DAYS, PLAN_DUE_SOON_HOURS, parseDay,
  type AssetKind, type AssetStatus, type PlanDueInfo,
  type WorkOrderAction, type WorkOrderStatus,
} from '../../services/maintenance'
import type {
  AssignmentType, WorkOrderPriority, WorkOrderType,
} from '../../services/maintenance/workOrders'

/**
 * Maintenance UI címke-térképek — a kanonikus státusz-kulcsok magyar
 * megjelenítése. A munkalap-pill tónusok a theme/fsmTones.ts
 * `maintenanceMunkalap` készletéből jönnek; itt csak a látható szöveg és a
 * nem-FSM tónusok (típus, prioritás, számított eszköz-státusz) élnek.
 */

export const WO_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  bejelentve: 'Bejelentve',
  utemezve: 'Ütemezve',
  folyamatban: 'Folyamatban',
  kesz: 'Kész',
  halasztva: 'Elhalasztva',
  elutasitva: 'Elutasítva',
}

export const WO_ACTION_LABELS: Record<WorkOrderAction, string> = {
  schedule: 'Ütemezés',
  start: 'Megkezdés',
  complete: 'Lezárás',
  postpone: 'Halasztás',
  reject: 'Elutasítás',
  reopen: 'Újranyitás',
}

/** A munkalap-FSM fő útja a stepperhez (halasztva/elutasitva mellékállapot). */
export const WO_MAIN_PATH: { key: WorkOrderStatus; label: string }[] = [
  { key: 'bejelentve', label: WO_STATUS_LABELS.bejelentve },
  { key: 'utemezve', label: WO_STATUS_LABELS.utemezve },
  { key: 'folyamatban', label: WO_STATUS_LABELS.folyamatban },
  { key: 'kesz', label: WO_STATUS_LABELS.kesz },
]

export const WO_TYPE_META: Record<WorkOrderType, { label: string; tone: Tone }> = {
  javitas: { label: 'Javítás', tone: 'warn' },
  megelozo: { label: 'Megelőző', tone: 'info' },
  takaritas: { label: 'Takarítás', tone: 'neutral' },
}

export const WO_PRIORITY_META: Record<WorkOrderPriority, { label: string; tone: Tone }> = {
  kritikus: { label: 'Kritikus', tone: 'danger' },
  magas: { label: 'Magas', tone: 'warn' },
  kozepes: { label: 'Közepes', tone: 'info' },
  alacsony: { label: 'Alacsony', tone: 'neutral' },
}

/** Prioritás-sorrend a listákhoz (kritikus elöl) — a backend enum-sorrend tükre. */
export const WO_PRIORITY_ORDER: WorkOrderPriority[] = [
  'kritikus', 'magas', 'kozepes', 'alacsony',
]

/** Az „esedékes megelőző" KPI alcíme — a config-küszöbökből SZÁMÍTVA (M2-lecke). */
export const PLAN_DUE_SOON_LABEL = `következő ${PLAN_DUE_SOON_DAYS} nap / ${PLAN_DUE_SOON_HOURS} üzemóra`

/** SZÁMÍTOTT eszköz-státusz (calc.ts) → címke + tónus — nem FSM, nincs akciója. */
export const ASSET_STATUS_META: Record<AssetStatus, { label: string; tone: Tone }> = {
  uzemel: { label: 'Üzemel', tone: 'success' },
  karbantartas: { label: 'Karbantartás', tone: 'info' },
  geptores: { label: 'Géptörés', tone: 'danger' },
  selejtezve: { label: 'Selejtezve', tone: 'terminal' },
}

export const ASSET_KIND_META: Record<AssetKind, { label: string; icon: string }> = {
  gep: { label: 'Gép', icon: 'settings' },
  jarmu: { label: 'Jármű', icon: 'truck' },
  szerszam: { label: 'Szerszám', icon: 'wrench' },
  infrastruktura: { label: 'Infrastruktúra', icon: 'factory' },
  it: { label: 'IT', icon: 'chart' },
  helyiseg: { label: 'Helyiség', icon: 'home' },
}

export const ASSET_KIND_ORDER: AssetKind[] = [
  'gep', 'jarmu', 'szerszam', 'infrastruktura', 'it', 'helyiseg',
]

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  belso: 'Belső szerelő',
  kulso: 'Külső partner',
}

export const PLAN_TRIGGER_LABELS: Record<'idokoz' | 'uzemora', string> = {
  idokoz: 'időköz (nap)',
  uzemora: 'üzemóra',
}

// ── Formázók ────────────────────────────────────────────────────────────────

/** Óraszám tömören (2 → „2 ó", 1.5 → „1,5 ó"). */
export function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10
  return `${String(rounded).replace('.', ',')} ó`
}

/** Dátum — a nap-kulcsot a HELYI idejű parseDay bontja (NE `new Date(iso)`: UTC-csapda, review M1). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseDay(iso).toLocaleDateString('hu-HU')
}

/** Üzemóra ezres tagolással („12 400 üó"). */
export function formatOperatingHours(h: number): string {
  return `${h.toLocaleString('hu-HU')} üó`
}

/** Terv-esedékesség badge-szöveg + tónus a planDueInfo-ból (szín + szöveg). */
export function planDueLabel(info: PlanDueInfo): { label: string; tone: Tone } {
  if (info.unit === 'nap') {
    const days = info.daysLeft ?? 0
    if (info.due) {
      return {
        label: days < 0 ? `${Math.abs(days)} napja lejárt` : 'ma esedékes',
        tone: 'danger',
      }
    }
    if (info.dueSoon) return { label: `${days} nap múlva esedékes`, tone: 'warn' }
    return { label: `${days} nap múlva`, tone: 'neutral' }
  }
  const hours = Math.round(info.hoursLeft ?? 0)
  if (info.due) {
    return {
      label: hours < 0 ? `${Math.abs(hours)} üó túllépés` : 'esedékes (üzemóra)',
      tone: 'danger',
    }
  }
  if (info.dueSoon) return { label: `${hours} üó múlva esedékes`, tone: 'warn' }
  return { label: `${hours} üó múlva`, tone: 'neutral' }
}

/** Rövid nap-fejléc az ütemterv-rácshoz: „H 7.13". */
const DOW_SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']

export function formatGridDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  const dow = parseDay(iso).getDay()
  return `${DOW_SHORT[dow]} ${m}.${d}`
}

/** Hétvége-e a nap (az ütemterv-rács halvány oszlopaihoz). */
export function isWeekend(iso: string): boolean {
  const dow = parseDay(iso).getDay()
  return dow === 0 || dow === 6
}

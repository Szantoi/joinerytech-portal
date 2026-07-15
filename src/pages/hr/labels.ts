import type { Tone } from '../../theme/statusTones'
import type { AbsenceAction, AbsenceStatus, LoadBand } from '../../services/hr'
import type { AbsenceType } from '../../services/hr/absences'
import type { HrDept, PayGrade, SkillKey, SkillLevel } from '../../services/hr/employees'

/**
 * HR UI címke-térképek — a kanonikus státusz-kulcsok magyar megjelenítése.
 * A távollét-pill tónusok a theme/fsmTones.ts `hrTavollet` készletéből
 * jönnek; itt csak a látható szöveg és a nem-FSM tónusok élnek.
 */

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  kert: 'Kért',
  jovahagyva: 'Jóváhagyva',
  folyamatban: 'Folyamatban',
  lezarva: 'Lezárva',
  elutasitva: 'Elutasítva',
}

export const ABSENCE_ACTION_LABELS: Record<AbsenceAction, string> = {
  approve: 'Jóváhagyás',
  reject: 'Elutasítás',
  start: 'Megkezdés',
  complete: 'Lezárás',
  reopen: 'Újranyitás',
}

/** A távollét-FSM fő útja a stepperhez (az elutasítva mellékállapot). */
export const ABSENCE_MAIN_PATH: { key: AbsenceStatus; label: string }[] = [
  { key: 'kert', label: ABSENCE_STATUS_LABELS.kert },
  { key: 'jovahagyva', label: ABSENCE_STATUS_LABELS.jovahagyva },
  { key: 'folyamatban', label: ABSENCE_STATUS_LABELS.folyamatban },
  { key: 'lezarva', label: ABSENCE_STATUS_LABELS.lezarva },
]

export const ABSENCE_TYPE_META: Record<AbsenceType, { label: string; tone: Tone }> = {
  szabadsag: { label: 'Szabadság', tone: 'progress' },
  betegseg: { label: 'Betegszabadság', tone: 'danger' },
  fizetes_nelkuli: { label: 'Fizetés nélküli', tone: 'neutral' },
  egyeb: { label: 'Egyéb távollét', tone: 'warn' },
}

export const DEPT_META: Record<HrDept, { label: string; tone: Tone }> = {
  gyartas: { label: 'Gyártás / műhely', tone: 'progress' },
  szereles: { label: 'Szerelés / beépítés', tone: 'warn' },
  logisztika: { label: 'Logisztika', tone: 'info' },
  tervezes: { label: 'Tervezés', tone: 'neutral' },
  ertekesites: { label: 'Értékesítés', tone: 'success' },
  iroda: { label: 'Iroda / admin', tone: 'neutral' },
}

export const DEPT_ORDER: HrDept[] = [
  'gyartas', 'szereles', 'logisztika', 'tervezes', 'ertekesites', 'iroda',
]

export const PAY_GRADE_LABELS: Record<PayGrade, string> = {
  seged: 'Segéd / betanított',
  szakmunkas: 'Szakmunkás',
  mester: 'Mester / előmunkás',
  mernok: 'Mérnök / tervező',
  vezeto: 'Vezető',
}

export const EMPLOYMENT_LABELS: Record<'full' | 'part', string> = {
  full: 'Teljes munkaidő',
  part: 'Részmunkaidő',
}

export const SKILL_LABELS: Record<SkillKey, string> = {
  szabas: 'Szabászat',
  elzaras: 'Élzárás',
  cnc: 'CNC',
  osszeszereles: 'Összeszerelés',
  felulet: 'Felületkezelés',
  szerel: 'Beépítés',
  szallit: 'Szállítás',
  felmer: 'Felmérés',
  tervezes: 'Tervezés / CAD',
  ertekesites: 'Értékesítés',
}

export const SKILL_ORDER: SkillKey[] = [
  'szabas', 'elzaras', 'cnc', 'osszeszereles', 'felulet',
  'szerel', 'szallit', 'felmer', 'tervezes', 'ertekesites',
]

/**
 * Készség-szint: a szint SZÁMKÉNT is látszik a pillben (nem csak szín —
 * review-lecke: non-color-only jelzés).
 */
export const SKILL_LEVEL_META: Record<SkillLevel, { label: string; short: string; tone: Tone }> = {
  1: { label: 'Alap', short: '1', tone: 'neutral' },
  2: { label: 'Rutin', short: '2', tone: 'warn' },
  3: { label: 'Mester', short: '3', tone: 'success' },
}

/** SZÁMÍTOTT terhelés-sáv → címke + tónus (calc.ts loadBand). */
export const LOAD_BAND_META: Record<LoadBand, { label: string; tone: Tone }> = {
  idle: { label: 'Szabad', tone: 'neutral' },
  ok: { label: 'Rendben', tone: 'success' },
  high: { label: 'Magas terhelés', tone: 'warn' },
  over: { label: 'Túlterhelt', tone: 'danger' },
}

// ── Formázók ────────────────────────────────────────────────────────────────

/** Óraszám tömören (6 → „6 ó", 6.4 → „6,4 ó"). */
export function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10
  return `${String(rounded).replace('.', ',')} ó`
}

/** Órabér Ft/ó formában, ezres tagolással. */
export function formatRate(rate: number): string {
  return `${rate.toLocaleString('hu-HU')} Ft/ó`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('hu-HU')
}

/** Rövid nap-fejléc a kapacitás-rácshoz: „H 7.13". */
const DOW_SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']

export function formatGridDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  const dow = new Date(iso).getDay()
  return `${DOW_SHORT[dow]} ${m}.${d}`
}

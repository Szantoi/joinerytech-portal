import type { Tone } from '../../../theme/statusTones'
import { parseDay } from '../../../services/dateUtils'
import type { CostCategory, MarginBand } from '../services/calc'
import type { ProjectStatus } from '../services/projects'
import type { AdjustmentScope } from '../services/adjustments'

/**
 * Kontrolling UI címke-térképek — a kanonikus kulcsok magyar megjelenítése.
 * A projekt-státusz pill-tónusok a theme/fsmTones.ts `kontrollingProjekt`
 * készletéből jönnek (címkék, nem szigorú FSM — visszafogott tónusok).
 */

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Vázlat',
  active: 'Folyamatban',
  install: 'Beépítés',
  done: 'Kész',
  on_hold: 'Áll',
}

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  anyag: 'Anyag',
  munka: 'Munkaóra',
  bermunka: 'Bérmunka',
  szallitas: 'Szállítás',
  beszallito: 'Beszállítói számla',
  rezsi: 'Rezsi / átalány',
}

export const SCOPE_LABELS: Record<AdjustmentScope, string> = {
  project: 'Projekt',
  portfolio: 'Portfólió',
}

/** Fedezet-sáv (calc.marginBand) → címke + tónus + sáv-szín. */
export const MARGIN_BAND_META: Record<MarginBand, { label: string; tone: Tone; bar: string }> = {
  none: { label: '—', tone: 'neutral', bar: 'bg-stone-400' },
  loss: { label: 'Veszteséges', tone: 'danger', bar: 'bg-rose-500' },
  weak: { label: 'Gyenge', tone: 'warn', bar: 'bg-amber-500' },
  medium: { label: 'Közepes', tone: 'info', bar: 'bg-sky-500' },
  good: { label: 'Jó', tone: 'success', bar: 'bg-emerald-500' },
}

// ── Formázók ────────────────────────────────────────────────────────────────

/** Teljes Ft-összeg ezres tagolással. */
export function formatHuf(n: number): string {
  return Math.round(n).toLocaleString('hu-HU') + ' Ft'
}

/** Millió Ft-ban, tömören (KPI-k, táblázatok). */
export function formatHufM(n: number): string {
  const v = n / 1e6
  return (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',') + ' M Ft'
}

/** Előjeles Ft (eltérések, korrekciók): +84 000 Ft / −35 000 Ft. */
export function formatSignedHuf(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return sign + formatHuf(Math.abs(n))
}

export function formatPct(x: number | null): string {
  return x == null ? '—' : Math.round(x * 100) + '%'
}

/** Dátum — a nap-kulcsot a HELYI idejű parseDay bontja (NE `new Date(iso)`: UTC-csapda). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseDay(iso).toLocaleDateString('hu-HU')
}

/** Trend-hónap (YYYY-MM) → rövid magyar hónapnév (helyi idejű parse — UTC-csapda ellen). */
export function formatMonth(month: string): string {
  return parseDay(`${month}-01`).toLocaleDateString('hu-HU', { month: 'short' })
}

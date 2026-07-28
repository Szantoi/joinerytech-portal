/**
 * SVG_TONES — a STATUS_TONES tónus-skála SVG-rajzoló csatornája.
 *
 * A `bg-*` / `text-*` utility-k SVG-alakzatra nem hatnak (a kitöltés `fill`,
 * a keret `stroke`), ezért a 7 tónusnak van egy `fill-*` / `stroke-*` párja.
 * Az ÉRTÉKEK a ./statusTones.ts pár-jaiból származnak, hogy egy pill és egy
 * Gantt-sáv ugyanazt a jelentést ugyanabban a színben mutassa:
 *
 *   STATUS_TONES.bg  →  SVG_TONES.fill   (a sáv/csomópont kitöltése)
 *   STATUS_TONES.dot →  SVG_TONES.stroke (a sáv/csomópont kerete)
 *   STATUS_TONES.fg  →  SVG_TONES.text   (a sávon lévő felirat — SVG-ben `fill`)
 *
 * A `bg`/`fg` pár WCAG 2.1 AA-ra hitelesített (spec 1.6), ezért a sávfelirat
 * NEM fehér a telített színen, hanem a tónus `fg`-je a világos kitöltésen.
 *
 * Semleges (tónus nélküli) rajzelemekhez az AXIS_CLASSES konstansok valók —
 * hardcode szín SVG-ben sem megengedett.
 */

import type { Tone } from './statusTones'

export interface SvgToneStyle {
  /** Alakzat kitöltése (STATUS_TONES.bg megfelelője). */
  fill: string
  /** Alakzat kerete (STATUS_TONES.dot megfelelője). */
  stroke: string
  /** Alakzaton lévő felirat (STATUS_TONES.fg megfelelője). */
  text: string
}

export const SVG_TONES: Record<Tone, SvgToneStyle> = {
  neutral: {
    fill: 'fill-stone-100 dark:fill-stone-800',
    stroke: 'stroke-stone-400 dark:stroke-stone-500',
    text: 'fill-stone-700 dark:fill-stone-300',
  },
  info: {
    fill: 'fill-sky-100 dark:fill-sky-950',
    stroke: 'stroke-sky-500 dark:stroke-sky-400',
    text: 'fill-sky-800 dark:fill-sky-300',
  },
  progress: {
    fill: 'fill-teal-100 dark:fill-teal-950',
    stroke: 'stroke-teal-500 dark:stroke-teal-400',
    text: 'fill-teal-800 dark:fill-teal-300',
  },
  success: {
    fill: 'fill-emerald-100 dark:fill-emerald-950',
    stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
    text: 'fill-emerald-800 dark:fill-emerald-300',
  },
  warn: {
    fill: 'fill-amber-100 dark:fill-amber-950',
    stroke: 'stroke-amber-500 dark:stroke-amber-400',
    text: 'fill-amber-800 dark:fill-amber-300',
  },
  danger: {
    fill: 'fill-rose-100 dark:fill-rose-950',
    stroke: 'stroke-rose-500 dark:stroke-rose-400',
    text: 'fill-rose-800 dark:fill-rose-300',
  },
  terminal: {
    fill: 'fill-stone-200 dark:fill-stone-800',
    stroke: 'stroke-stone-500 dark:stroke-stone-400',
    text: 'fill-stone-600 dark:fill-stone-400',
  },
}

/**
 * Semleges vázelemek (tengely, rács, sorválasztó, feliratok) osztályai.
 * Ezek NEM státusz-tintek, hanem felület-/vonalszínek, ezért szemantikus
 * tokenből jönnek (index.css `@theme inline`), nem nyers palettából.
 */
export const SVG_AXIS = {
  /** Sorválasztó és tengelyvonal. */
  line: 'stroke-line',
  /** Rács-segédvonal (halványabb, szaggatott). */
  grid: 'stroke-line/70',
  /** Tengely-felirat. */
  tick: 'fill-ink-soft',
  /** Sor-/csomópont-felirat. */
  label: 'fill-ink',
  /** Másodlagos felirat. */
  muted: 'fill-ink-soft',
} as const

/**
 * STATUS_TONES — generikus, 7 elemű szemantikus tónus-skála (light + dark).
 *
 * Forrás: docs/knowledge/patterns/DESIGN_SYSTEM_SPEC_V1.md, 1.4 fejezet.
 * A pill-ek NEM modulonként kapnak színt: a tónus-kulcs a rendering, a
 * modul-FSM → tónus térkép (./fsmTones.ts) a jelentés.
 *
 * Kontraszt-szabályok (WCAG 2.1 AA, spec 1.6):
 *  - light: `-100` bg + `-800` fg (a régi `-50` + `-700` párok bukták az AA-t)
 *  - dark:  `-950` bg + `-300` fg
 *  - `danger` = rose (nem red), hogy elváljon az EHS világ-akcenttől
 *  - `terminal` dot üreges (border) — forma-alapú jelzés, nem csak szín
 */

export type Tone =
  | 'neutral' | 'info' | 'progress' | 'success' | 'warn' | 'danger' | 'terminal'

export interface ToneStyle { bg: string; fg: string; dot: string }

export const STATUS_TONES: Record<Tone, ToneStyle> = {
  neutral: {
    bg: 'bg-stone-100 dark:bg-stone-800',
    fg: 'text-stone-700 dark:text-stone-300',
    dot: 'bg-stone-400 dark:bg-stone-500',
  },
  info: {
    bg: 'bg-sky-100 dark:bg-sky-950',
    fg: 'text-sky-800 dark:text-sky-300',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
  progress: {
    bg: 'bg-teal-100 dark:bg-teal-950',
    fg: 'text-teal-800 dark:text-teal-300',
    dot: 'bg-teal-500 dark:bg-teal-400',
  },
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    fg: 'text-emerald-800 dark:text-emerald-300',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  warn: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    fg: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  danger: {
    bg: 'bg-rose-100 dark:bg-rose-950',
    fg: 'text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  terminal: {
    bg: 'bg-stone-200 dark:bg-stone-800',
    fg: 'text-stone-600 dark:text-stone-400',
    // üreges dot: border-alapú, forma-jelzés
    dot: 'bg-transparent border-2 border-stone-500 dark:border-stone-400',
  },
}

/** Type guard: a string érvényes tónus-kulcs-e. */
export function isTone(value: string): value is Tone {
  return value in STATUS_TONES
}

/**
 * A régi, ad-hoc StatusPill státusz-kulcsok → tónus térkép.
 * A nem-platform komponensek (BatchTimeline, settings panelek stb.)
 * kompatibilitása miatt marad; új kód közvetlenül tónust vagy FSM-készletet ad át.
 */
export const LEGACY_STATUS_TONES: Record<string, Tone> = {
  draft: 'neutral',
  calc: 'warn',
  ready: 'info',
  released: 'success',
  planned: 'neutral',
  running: 'progress',
  done: 'success',
  low: 'warn',
  ok: 'success',
  critical: 'danger',
}

/**
 * Legacy státusz-kulcs (vagy közvetlen tónus-név) feloldása tónusra.
 * Ismeretlen kulcs → `neutral` + dev-warning (spec 2.5 acceptance).
 */
export function resolveLegacyTone(status: string): Tone {
  if (isTone(status)) return status
  const legacy = LEGACY_STATUS_TONES[status]
  if (legacy) return legacy
  if (import.meta.env.DEV) {
    console.warn(`[statusTones] Ismeretlen státusz-kulcs: "${status}" — neutral tónus lesz`)
  }
  return 'neutral'
}

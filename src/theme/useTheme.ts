/**
 * Téma-kezelés — class-alapú dark mode, három-állapotú preferenciával.
 *
 * Spec: DESIGN_SYSTEM_SPEC_V1.md 4.1 fejezet.
 *  - Preferencia: 'light' | 'dark' | 'system', localStorage kulcs: `jt-theme`
 *  - Mechanizmus: `.dark` class a <html> elemen (a no-flash script az
 *    index.html-ben ugyanezt a logikát futtatja a bundle előtt)
 *  - 'system' esetén a `prefers-color-scheme` media query dönt, és `change`
 *    eseményre élőben követi az OS-t.
 */

import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'jt-theme'

const VALID_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

// ── Module-szintű store (useSyncExternalStore forrása) ──────────────────────

let preference: ThemePreference = readStoredPreference()
const listeners = new Set<() => void>()

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    return VALID_PREFERENCES.includes(raw as ThemePreference)
      ? (raw as ThemePreference)
      : 'system'
  } catch {
    return 'system'
  }
}

function notify(): void {
  listeners.forEach((l) => l())
}

// ── Publikus, tesztelhető helper-ek ──────────────────────────────────────────

/** Az OS jelenleg dark módot preferál-e. */
export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

/** A preferencia + rendszer-állapot alapján dark-e az effektív téma. */
export function resolveIsDark(
  pref: ThemePreference,
  systemDark: boolean = systemPrefersDark(),
): boolean {
  return pref === 'dark' || (pref === 'system' && systemDark)
}

/** A `.dark` class szinkronizálása a <html> elemre az aktuális preferencia szerint. */
export function applyTheme(pref: ThemePreference = preference): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveIsDark(pref))
}

/** Aktuális preferencia (light | dark | system). */
export function getThemePreference(): ThemePreference {
  return preference
}

/** Preferencia beállítása: perzisztálás + class-frissítés + feliratkozók értesítése. */
export function setThemePreference(next: ThemePreference): void {
  preference = next
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // privát mód / letiltott storage — a téma a session erejéig így is él
  }
  applyTheme(next)
  notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ── Rendszer-preferencia élő követése ('system' módban) ─────────────────────
// Module-import időben iratkozunk fel, így a követés akkor is él, ha a
// ThemeToggle éppen nincs mountolva.

function initSystemListener(): void {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (preference === 'system') {
      applyTheme()
      notify()
    }
  }
  mq.addEventListener?.('change', onChange)
}

initSystemListener()

// ── React hook ───────────────────────────────────────────────────────────────

export interface UseThemeResult {
  /** A felhasználó által választott preferencia. */
  preference: ThemePreference
  /** Az effektív (feloldott) téma dark-e. */
  isDark: boolean
  /** Preferencia váltása (perzisztál + azonnal alkalmaz). */
  setPreference: (next: ThemePreference) => void
}

/** Téma-preferencia hook — useSyncExternalStore a module-szintű store fölött. */
export function useTheme(): UseThemeResult {
  const pref = useSyncExternalStore(subscribe, getThemePreference, () => 'system' as const)
  return {
    preference: pref,
    isDark: resolveIsDark(pref),
    setPreference: setThemePreference,
  }
}

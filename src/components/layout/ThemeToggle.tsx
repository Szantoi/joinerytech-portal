/**
 * ThemeToggle — háromállású téma-kapcsoló (Világos / Sötét / Rendszer).
 *
 * Spec: DESIGN_SYSTEM_SPEC_V1.md 4.1 — radiogroup szemantika, az aktuális
 * állapot felirattal (nem csak színnel) jelezve. A felhasználói menüben és a
 * mobil drawerben jelenik meg.
 */

import { useTheme, type ThemePreference } from '../../theme/useTheme'

interface ThemeOption {
  value: ThemePreference
  hu: string
  en: string
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', hu: 'Világos', en: 'Light' },
  { value: 'dark', hu: 'Sötét', en: 'Dark' },
  { value: 'system', hu: 'Rendszer', en: 'System' },
]

export function ThemeToggle({ lang = 'hu' }: { lang?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label={lang === 'en' ? 'Theme' : 'Téma'}
      className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2"
    >
      {THEME_OPTIONS.map((opt) => {
        const active = preference === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(opt.value)}
            className={`flex-1 h-7 px-2 rounded-md text-[11px] transition motion-reduce:transition-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring
              focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 ${
                active
                  ? 'bg-surface-1 text-ink font-semibold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
          >
            {lang === 'en' ? opt.en : opt.hu}
          </button>
        )
      })}
    </div>
  )
}

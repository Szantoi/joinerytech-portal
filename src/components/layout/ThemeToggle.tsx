/**
 * ThemeToggle — háromállású téma-kapcsoló (Világos / Sötét / Rendszer).
 *
 * Spec: design-system/dark-mode.html ("Bevezetés a portálba") — radiogroup
 * szemantika, az aktuális állapot felirattal (nem csak színnel) jelezve.
 * Megjelenik: Beállítások → Megjelenés, a felhasználói menü és a mobil drawer.
 * A gyors elérésű header-kapcsoló: ThemeQuickToggle (nap/hold/monitor ikon).
 */

import { useTheme, type ThemePreference } from '../../theme/useTheme'
import { Icon } from '../ui/Icon'

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

/** A gyors kapcsoló ciklusa: rendszer → világos → sötét → rendszer. */
const QUICK_CYCLE: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const QUICK_ICON: Record<ThemePreference, string> = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
}

const QUICK_LABEL: Record<ThemePreference, { hu: string; en: string }> = {
  system: { hu: 'Téma: rendszer', en: 'Theme: system' },
  light: { hu: 'Téma: világos', en: 'Theme: light' },
  dark: { hu: 'Téma: sötét', en: 'Theme: dark' },
}

/**
 * ThemeQuickToggle — gyors elérésű téma-kapcsoló a shell headerbe
 * (dark-mode.html: nap/hold/monitor ikon, aria-label-lel). Kattintásra a
 * rendszer → világos → sötét cikluson lép; az ikon az aktuális preferenciát
 * mutatja, az aria-label a jelenlegit ÉS a következőt is megnevezi.
 */
export function ThemeQuickToggle({ lang = 'hu', className = '' }: { lang?: string; className?: string }) {
  const { preference, setPreference } = useTheme()
  const next = QUICK_CYCLE[preference]
  const current = lang === 'en' ? QUICK_LABEL[preference].en : QUICK_LABEL[preference].hu
  const nextLabel = lang === 'en' ? QUICK_LABEL[next].en : QUICK_LABEL[next].hu

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`${current} — ${lang === 'en' ? 'switch' : 'váltás'}: ${nextLabel}`}
      title={current}
      className={`w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-2 hover:text-ink transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 ${className}`}
    >
      <Icon name={QUICK_ICON[preference]} size={14} />
    </button>
  )
}

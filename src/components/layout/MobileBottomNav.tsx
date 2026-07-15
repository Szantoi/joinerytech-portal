import { Icon } from '../ui/Icon'
import { selectBottomNavItems, screenIcon } from './bottomNav'
import type { WorldScreen } from '../../types'

/**
 * MobileBottomNav — world-screen bottom navigation (DESIGN_SYSTEM_SPEC_V1 §3.1).
 *
 * - Only visible < md (`md:hidden`); desktop uses the sidebar navigation.
 * - 58 px tall + safe-area padding; the page content gets a matching
 *   bottom padding from WorldShell so nothing hides behind the bar.
 * - Max 5 tabs: up to 4 direct screen tabs + a "Több" overflow that opens
 *   the mobile drawer with the full screen list (selection logic lives in
 *   ./bottomNav so it is unit-testable).
 * - Active tab: world-accent tinted pill behind the icon (bg-world-soft) +
 *   `aria-current="page"` — not a colour-only signal.
 * - The whole 58 px cell is the hit target (> 44 px), label always visible.
 *
 * Navigation intentionally goes through the `onScreen` callback (like the
 * sidebar's ScreenNavButton) so WorldShell stays router-agnostic.
 */

interface MobileBottomNavProps {
  /** The active world's screens (WORLDS[worldKey].screens). */
  screens: WorldScreen[]
  /** Active screen key. */
  active: string
  /** Navigate to a screen (WorldShell wires this to the router). */
  onScreen: (key: string) => void
  /** Open the mobile drawer with the full screen list ("Több"). */
  onMore: () => void
  /** Drawer open state — drives aria-expanded on the "Több" button. */
  moreOpen: boolean
  lang?: string
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring focus-visible:ring-inset'

/** One 58px-tall nav cell: icon in an (optionally tinted) pill + always-visible label. */
function NavCell({ icon, label, active, onClick, ...aria }: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
  'aria-current'?: 'page'
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...aria}
      className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 ${FOCUS_RING} ${
        active ? 'text-world-soft-fg' : 'text-ink-muted'
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-12 place-items-center rounded-full transition-colors motion-reduce:transition-none ${
          active ? 'bg-world-soft' : ''
        }`}
      >
        <Icon name={icon} size={20} />
      </span>
      <span className={`w-full truncate px-0.5 text-center text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  )
}

export function MobileBottomNav({ screens, active, onScreen, onMore, moreOpen, lang = 'hu' }: MobileBottomNavProps) {
  const { tabs, hasMore, moreActive } = selectBottomNavItems(screens, active)

  // No screens (e.g. standalone worlds) → nothing to navigate to.
  if (tabs.length === 0) return null

  return (
    <nav
      aria-label={lang === 'en' ? 'Main navigation' : 'Fő navigáció'}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-1 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-[58px] items-stretch">
        {tabs.map((s) => {
          const isActive = s.key === active
          return (
            <NavCell
              key={s.key}
              icon={screenIcon(s.key)}
              label={lang === 'en' && s.en ? s.en : s.hu}
              active={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onScreen(s.key)}
            />
          )
        })}
        {hasMore && (
          <NavCell
            icon="more"
            label={lang === 'en' ? 'More' : 'Több'}
            active={moreActive}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={onMore}
          />
        )}
      </div>
    </nav>
  )
}

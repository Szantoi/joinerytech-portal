import { useState, useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'
import { useFocusTrap } from '../ui/hooks/useFocusTrap'
import { useInertBackground } from '../ui/hooks/useInertBackground'
import { WorldIcon } from './WorldIcon'
import { ThemeToggle } from './ThemeToggle'
import { MobileBottomNav } from './MobileBottomNav'
import { ChatBubble } from '../chat/ChatBubble'
import { WORLDS } from '../../mocks/worlds'
import { WORLD_DATA_ATTR } from '../../theme/worldAccents'
import { useAuth } from '../../auth'
import type { World, WorldScreen } from '../../types'

/**
 * Világ-akcent osztálytérkép a világkártya / sidebar ikon-tintekhez.
 * A nav pill / fókusz-ring / primary akcentek NEM innen jönnek, hanem a
 * szemantikus world-* tokenekből (index.css, [data-world] indirekció).
 *
 * Root-döntés szerinti platform-akcentek: CRM=blue, Kontrolling=slate,
 * HR=amber, Maintenance=cyan, QA=lime, EHS=red, DMS=violet.
 *
 * S2 fix: a TopBar szövegszínei (breadcrumb / mobil világ-címke) már NEM az
 * `fg`-ből jönnek, hanem a `text-world-soft-fg` tokenből (light+dark AA).
 * Az `fg` egyetlen maradék fogyasztója a HomeScreen badge (light-only kártya,
 * Fázis 2 token-migrációs backlog — review N10).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ACCENT_MAP: Record<string, {
  tint: string
  iconBg: string
  iconFg: string
  fg: string
  sideBg: string
  sideAccent: string
  sideHover: string
}> = {
  teal:    { tint: 'bg-teal-100',    iconBg: 'bg-teal-100',    iconFg: 'text-teal-700',    fg: 'text-teal-700',    sideBg: 'bg-teal-50/30',    sideAccent: 'border-teal-600',    sideHover: 'hover:bg-teal-50' },
  blue:    { tint: 'bg-blue-100',    iconBg: 'bg-blue-100',    iconFg: 'text-blue-700',    fg: 'text-blue-700',    sideBg: 'bg-blue-50/30',    sideAccent: 'border-blue-600',    sideHover: 'hover:bg-blue-50' },
  indigo:  { tint: 'bg-indigo-100',  iconBg: 'bg-indigo-100',  iconFg: 'text-indigo-700',  fg: 'text-indigo-700',  sideBg: 'bg-indigo-50/30',  sideAccent: 'border-indigo-600',  sideHover: 'hover:bg-indigo-50' },
  amber:   { tint: 'bg-amber-100',   iconBg: 'bg-amber-100',   iconFg: 'text-amber-700',   fg: 'text-amber-700',   sideBg: 'bg-amber-50/30',   sideAccent: 'border-amber-600',   sideHover: 'hover:bg-amber-50' },
  emerald: { tint: 'bg-emerald-100', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700', fg: 'text-emerald-700', sideBg: 'bg-emerald-50/30', sideAccent: 'border-emerald-600', sideHover: 'hover:bg-emerald-50' },
  lime:    { tint: 'bg-lime-100',    iconBg: 'bg-lime-100',    iconFg: 'text-lime-700',    fg: 'text-lime-700',    sideBg: 'bg-lime-50/30',    sideAccent: 'border-lime-600',    sideHover: 'hover:bg-lime-50' },
  stone:   { tint: 'bg-stone-100',   iconBg: 'bg-stone-100',   iconFg: 'text-stone-700',   fg: 'text-stone-700',   sideBg: 'bg-stone-50/40',   sideAccent: 'border-stone-700',   sideHover: 'hover:bg-stone-100' },
  violet:  { tint: 'bg-violet-100',  iconBg: 'bg-violet-100',  iconFg: 'text-violet-700',  fg: 'text-violet-700',  sideBg: 'bg-violet-50/30',  sideAccent: 'border-violet-600',  sideHover: 'hover:bg-violet-50' },
  cyan:    { tint: 'bg-cyan-100',    iconBg: 'bg-cyan-100',    iconFg: 'text-cyan-700',    fg: 'text-cyan-700',    sideBg: 'bg-cyan-50/30',    sideAccent: 'border-cyan-600',    sideHover: 'hover:bg-cyan-50' },
  orange:  { tint: 'bg-orange-100',  iconBg: 'bg-orange-100',  iconFg: 'text-orange-700',  fg: 'text-orange-700',  sideBg: 'bg-orange-50/30',  sideAccent: 'border-orange-600',  sideHover: 'hover:bg-orange-50' },
  red:     { tint: 'bg-red-100',     iconBg: 'bg-red-100',     iconFg: 'text-red-700',     fg: 'text-red-700',     sideBg: 'bg-red-50/30',     sideAccent: 'border-red-600',     sideHover: 'hover:bg-red-50' },
  rose:    { tint: 'bg-rose-100',    iconBg: 'bg-rose-100',    iconFg: 'text-rose-700',    fg: 'text-rose-700',    sideBg: 'bg-rose-50/30',    sideAccent: 'border-rose-600',    sideHover: 'hover:bg-rose-50' },
  sky:     { tint: 'bg-sky-100',     iconBg: 'bg-sky-100',     iconFg: 'text-sky-700',     fg: 'text-sky-700',     sideBg: 'bg-sky-50/30',     sideAccent: 'border-sky-600',     sideHover: 'hover:bg-sky-50' },
  slate:   { tint: 'bg-slate-100',   iconBg: 'bg-slate-100',   iconFg: 'text-slate-700',   fg: 'text-slate-700',   sideBg: 'bg-slate-50/30',   sideAccent: 'border-slate-600',   sideHover: 'hover:bg-slate-50' },
  purple:  { tint: 'bg-purple-100',  iconBg: 'bg-purple-100',  iconFg: 'text-purple-700',  fg: 'text-purple-700',  sideBg: 'bg-purple-50/30',  sideAccent: 'border-purple-600',  sideHover: 'hover:bg-purple-50' },
}

/** Közös fókusz-ring (spec 2. fejezet): world-akcentes, offsettel. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1'

interface WorldSidebarProps {
  world: World
  accent: typeof ACCENT_MAP.teal
  screen: string
  onScreen: (key: string) => void
  onHome: () => void
  lang: string
}

/** Világon belüli képernyő-nav elem — aktív állapota a world-soft tokent használja. */
function ScreenNavButton({ screen, active, tall, onClick, lang }: {
  screen: WorldScreen
  active: boolean
  tall?: boolean
  onClick: () => void
  lang: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 rounded-lg text-left transition motion-reduce:transition-none ${FOCUS_RING} ${
        tall ? 'h-11 text-[13.5px]' : 'h-9 text-[12.5px]'
      } ${
        active
          ? 'bg-world-soft text-world-soft-fg font-medium'
          : 'text-ink-muted hover:text-ink hover:bg-surface-2'
      }`}
    >
      <span className={`w-1 h-4 rounded-full ${active ? 'bg-world' : 'bg-transparent'}`} />
      <span className="flex-1 truncate">{lang === 'en' && screen.en ? screen.en : screen.hu}</span>
    </button>
  )
}

function WorldSidebar({ world, accent, screen, onScreen, onHome, lang }: WorldSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-surface-1 border-r border-line flex-col">
      <button onClick={onHome} className={`px-4 py-4 border-b border-line flex items-center gap-2.5 hover:bg-surface-2 text-left ${FOCUS_RING}`}>
        <div className="w-8 h-8 rounded-lg bg-stone-900 grid place-items-center text-white">
          <span className="text-[13px] font-bold tracking-tighter">jt</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold tracking-tight text-ink leading-tight">
            joinery<span className="text-teal-600">/</span>tech
          </div>
          <div className="text-[10px] text-ink-muted truncate">
            {lang === 'en' ? '← All workspaces' : '← Vissza a Home-ra'}
          </div>
        </div>
      </button>

      <div className={`px-4 py-3 border-b border-line ${accent.sideBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconFg} grid place-items-center`}>
            <WorldIcon name={world.icon} size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-ink">{lang === 'en' ? world.en : world.hu}</div>
            <div className="text-[10px] text-ink-muted">{lang === 'en' ? 'Workspace' : 'Munkavilág'}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {world.screens.map((s: WorldScreen) => (
          <ScreenNavButton key={s.key} screen={s} active={screen === s.key} onClick={() => onScreen(s.key)} lang={lang} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-line text-[10.5px] text-ink-muted font-mono">v3.2.1</div>
    </aside>
  )
}

function UserMenu({ lang }: { lang: string }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const name = user?.profile?.name ?? user?.profile?.email ?? (lang === 'en' ? 'User' : 'Felhasználó')
  const initials = name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-surface-2 border border-transparent hover:border-line transition motion-reduce:transition-none ${FOCUS_RING}`}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[10px] font-semibold text-white">
          {initials}
        </div>
        <span className="text-[12px] text-ink-muted max-w-[120px] truncate hidden md:block">{name}</span>
        <Icon name="down" size={11} className="text-ink-muted hidden md:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-56 bg-surface-1 border border-line rounded-xl shadow-lg py-1">
            <div className="px-3 py-2 border-b border-line mb-1">
              <div className="text-[12px] font-medium text-ink truncate">{name}</div>
              {user?.profile?.email && (
                <div className="text-[11px] text-ink-muted truncate">{user.profile.email}</div>
              )}
            </div>
            <div className="px-3 py-2 border-b border-line">
              <div className="text-[10px] uppercase tracking-wide text-ink-muted font-medium mb-1.5">
                {lang === 'en' ? 'Theme' : 'Téma'}
              </div>
              <ThemeToggle lang={lang} />
            </div>
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition motion-reduce:transition-none"
            >
              <Icon name="logout" size={13} />
              {lang === 'en' ? 'Sign out' : 'Kijelentkezés'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface WorldTopBarProps extends Omit<WorldSidebarProps, 'onScreen' | 'accent'> {
  onMenu: () => void
}

function WorldTopBar({ world, screen, onHome, lang, onMenu }: WorldTopBarProps) {
  const screenObj = world.screens.find((s: WorldScreen) => s.key === screen) ?? world.screens[0]
  const screenLabel = lang === 'en' && screenObj?.en ? screenObj.en : screenObj?.hu

  return (
    <header className="bg-surface-1 border-b border-line">
      <div className="px-4 md:px-7 py-4 flex items-center gap-3 md:gap-4">
        <button
          onClick={onMenu}
          aria-label="Menü"
          className={`md:hidden w-9 h-9 -ml-1 grid place-items-center rounded-lg text-ink-muted hover:bg-surface-2 shrink-0 ${FOCUS_RING}`}
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="md:hidden min-w-0 flex-1">
          {/* S2 fix: world-soft-fg token a [data-world] scope-ból — light+dark AA a surface-1-en */}
          <div className="text-[10px] font-medium text-world-soft-fg truncate">{lang === 'en' ? world.en : world.hu}</div>
          <div className="text-[14px] font-semibold tracking-tight text-ink leading-tight truncate">{screenLabel}</div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11.5px] text-ink-muted">
          <button onClick={onHome} className="hover:text-ink">Home</button>
          <Icon name="chevron" size={11} className="text-stone-300 dark:text-stone-600" />
          <span className="text-world-soft-fg font-medium">{lang === 'en' ? world.en : world.hu}</span>
          {screenObj && (
            <>
              <Icon name="chevron" size={11} className="text-stone-300 dark:text-stone-600" />
              <span className="text-ink font-medium">{screenLabel}</span>
            </>
          )}
        </div>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <input
              aria-label={lang === 'en' ? 'Search' : 'Keresés'}
              placeholder={lang === 'en' ? 'Search…' : 'Keresés…'}
              className="h-8 w-56 pl-8 pr-3 rounded-lg border border-line text-[12px] text-ink placeholder:text-ink-muted focus:border-stone-400 focus:ring-1 focus:ring-world-ring outline-none bg-surface-2/60"
            />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          </div>
          <button
            aria-label={lang === 'en' ? 'Notifications' : 'Értesítések'}
            className={`w-8 h-8 grid place-items-center rounded-lg border border-line text-ink-muted hover:bg-surface-2 relative ${FOCUS_RING}`}
          >
            <Icon name="bell" size={14} />
            <span aria-hidden="true" className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>
          <UserMenu lang={lang} />
        </div>
      </div>
      <div className="hidden md:block px-7 pb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">{screenLabel}</h1>
      </div>
    </header>
  )
}

interface WorldMobileDrawerProps extends WorldSidebarProps {
  open: boolean
  onClose: () => void
}

function WorldMobileDrawer({ open, onClose, world, accent, screen, onScreen, onHome, lang }: WorldMobileDrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  // Dialog-viselkedés a spec §2.2 hookjaival (SlideOver-rel közös implementáció).
  // Sorrend számít: záráskor előbb szűnik meg a háttér-inert, aztán tér vissza
  // a fókusz a megnyitó elemre (a trap cleanupja adja vissza).
  useInertBackground(rootRef, open)
  useFocusTrap(panelRef, open)

  return (
    <div
      ref={rootRef}
      // Zárva mountolva marad az animáció miatt — az `inert` zárja ki a
      // billentyűzet/AT elérést (WCAG 4.1.2), nyitva a hookok kezelik a hátteret.
      inert={!open}
      className={`md:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        ref={panelRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label={lang === 'en' ? 'Menu' : 'Menü'}
        tabIndex={-1}
        className={`absolute inset-y-0 left-0 w-[280px] max-w-[82%] bg-surface-1 shadow-2xl flex flex-col transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-4 py-4 border-b border-line flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 grid place-items-center text-white shrink-0">
            <span className="text-[13px] font-bold tracking-tighter">jt</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold tracking-tight text-ink leading-tight">
              joinery<span className="text-teal-600">/</span>tech
            </div>
            <div className="text-[10px] text-ink-muted truncate">portál</div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === 'en' ? 'Close' : 'Bezárás'}
            className={`w-9 h-9 grid place-items-center rounded-lg text-ink-muted hover:bg-surface-2 -mr-1 ${FOCUS_RING}`}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <button
          onClick={() => { onHome(); onClose() }}
          className={`px-4 py-3 border-b border-line flex items-center gap-2 text-[12px] text-ink-muted hover:bg-surface-2 text-left ${FOCUS_RING}`}
        >
          <Icon name="chevron" size={14} className="rotate-180" />
          {lang === 'en' ? 'All workspaces' : 'Vissza a Home-ra'}
        </button>

        <div className={`px-4 py-3 border-b border-line ${accent.sideBg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconFg} grid place-items-center`}>
              <WorldIcon name={world.icon} size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink">{lang === 'en' ? world.en : world.hu}</div>
              <div className="text-[10px] text-ink-muted">{lang === 'en' ? 'Workspace' : 'Munkavilág'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {world.screens.map((s: WorldScreen) => (
            <ScreenNavButton
              key={s.key}
              screen={s}
              active={screen === s.key}
              tall
              onClick={() => { onScreen(s.key); onClose() }}
              lang={lang}
            />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-line space-y-2">
          <ThemeToggle lang={lang} />
          <div className="text-[10.5px] text-ink-muted font-mono">v3.2.1</div>
        </div>
      </aside>
    </div>
  )
}

interface WorldShellProps {
  worldKey: string
  screen: string
  onScreen: (key: string) => void
  onHome: () => void
  lang?: string
  children: React.ReactNode
}

export function WorldShell({ worldKey, screen, onScreen, onHome, lang = 'hu', children }: WorldShellProps) {
  const w = WORLDS[worldKey as keyof typeof WORLDS]
  const accent = ACCENT_MAP[w?.accent ?? 'teal'] ?? ACCENT_MAP.teal

  const isShopFloor = worldKey === 'shopfloor'
  const [menuOpen, setMenuOpen] = useState(false)

  // Close drawer on navigation — render-time state adjustment instead of a
  // sync setState-in-effect (react-hooks/set-state-in-effect), so React can
  // restart the render immediately without painting the stale open drawer.
  const [prevNav, setPrevNav] = useState({ screen, worldKey })
  if (prevNav.screen !== screen || prevNav.worldKey !== worldKey) {
    setPrevNav({ screen, worldKey })
    setMenuOpen(false)
  }

  // Esc closes the drawer (scroll-lock + background inert lives in the drawer's
  // useInertBackground hook; focus return in its useFocusTrap cleanup).
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  if (!w) return null

  // Bottom nav only makes sense when the world has screens to switch between
  // (standalone worlds like shopfloor have none — spec §3.1).
  const hasBottomNav = !isShopFloor && w.screens.length > 0

  return (
    // data-world: erre a gyökérre oldódnak fel a world-* akcent-tokenek
    // (platform-világok; a többinél a :root fallback akcent él)
    <div className="flex min-h-screen bg-surface-0" data-world={WORLD_DATA_ATTR[worldKey]}>
      <WorldSidebar world={w} accent={accent} screen={screen} onScreen={onScreen} onHome={onHome} lang={lang} />
      {/* < md: alsó padding a bottom nav magasságával, hogy semmi ne csússzon alá (spec §3.1) */}
      <main className={`flex-1 min-w-0 flex flex-col ${hasBottomNav ? 'pb-[calc(58px+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <WorldTopBar world={w} screen={screen} onHome={onHome} lang={lang} onMenu={() => setMenuOpen(true)} />
        <div className="flex-1">{children}</div>
      </main>
      <WorldMobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        world={w}
        accent={accent}
        screen={screen}
        onScreen={onScreen}
        onHome={onHome}
        lang={lang}
      />
      {hasBottomNav && (
        <MobileBottomNav
          screens={w.screens}
          active={screen}
          onScreen={onScreen}
          onMore={() => setMenuOpen(true)}
          moreOpen={menuOpen}
          lang={lang}
        />
      )}
      {!isShopFloor && <ChatBubble page={`${w.hu} / ${screen}`} aboveBottomNav={hasBottomNav} />}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { WorldIcon } from './WorldIcon'
import { ChatBubble } from '../chat/ChatBubble'
import { WORLDS } from '../../mocks/worlds'
import { useAuth } from '../../auth'
import type { World, WorldScreen } from '../../types'

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
  indigo:  { tint: 'bg-indigo-100',  iconBg: 'bg-indigo-100',  iconFg: 'text-indigo-700',  fg: 'text-indigo-700',  sideBg: 'bg-indigo-50/30',  sideAccent: 'border-indigo-600',  sideHover: 'hover:bg-indigo-50' },
  amber:   { tint: 'bg-amber-100',   iconBg: 'bg-amber-100',   iconFg: 'text-amber-700',   fg: 'text-amber-700',   sideBg: 'bg-amber-50/30',   sideAccent: 'border-amber-600',   sideHover: 'hover:bg-amber-50' },
  emerald: { tint: 'bg-emerald-100', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700', fg: 'text-emerald-700', sideBg: 'bg-emerald-50/30', sideAccent: 'border-emerald-600', sideHover: 'hover:bg-emerald-50' },
  stone:   { tint: 'bg-stone-100',   iconBg: 'bg-stone-100',   iconFg: 'text-stone-700',   fg: 'text-stone-700',   sideBg: 'bg-stone-50/40',   sideAccent: 'border-stone-700',   sideHover: 'hover:bg-stone-100' },
  violet:  { tint: 'bg-violet-100',  iconBg: 'bg-violet-100',  iconFg: 'text-violet-700',  fg: 'text-violet-700',  sideBg: 'bg-violet-50/30',  sideAccent: 'border-violet-600',  sideHover: 'hover:bg-violet-50' },
  cyan:    { tint: 'bg-cyan-100',    iconBg: 'bg-cyan-100',    iconFg: 'text-cyan-700',    fg: 'text-cyan-700',    sideBg: 'bg-cyan-50/30',    sideAccent: 'border-cyan-600',    sideHover: 'hover:bg-cyan-50' },
  orange:  { tint: 'bg-orange-100',  iconBg: 'bg-orange-100',  iconFg: 'text-orange-700',  fg: 'text-orange-700',  sideBg: 'bg-orange-50/30',  sideAccent: 'border-orange-600',  sideHover: 'hover:bg-orange-50' },
  rose:    { tint: 'bg-rose-100',    iconBg: 'bg-rose-100',    iconFg: 'text-rose-700',    fg: 'text-rose-700',    sideBg: 'bg-rose-50/30',    sideAccent: 'border-rose-600',    sideHover: 'hover:bg-rose-50' },
  sky:     { tint: 'bg-sky-100',     iconBg: 'bg-sky-100',     iconFg: 'text-sky-700',     fg: 'text-sky-700',     sideBg: 'bg-sky-50/30',     sideAccent: 'border-sky-600',     sideHover: 'hover:bg-sky-50' },
  slate:   { tint: 'bg-slate-100',   iconBg: 'bg-slate-100',   iconFg: 'text-slate-700',   fg: 'text-slate-700',   sideBg: 'bg-slate-50/30',   sideAccent: 'border-slate-600',   sideHover: 'hover:bg-slate-50' },
  purple:  { tint: 'bg-purple-100',  iconBg: 'bg-purple-100',  iconFg: 'text-purple-700',  fg: 'text-purple-700',  sideBg: 'bg-purple-50/30',  sideAccent: 'border-purple-600',  sideHover: 'hover:bg-purple-50' },
}

interface WorldSidebarProps {
  world: World
  accent: typeof ACCENT_MAP.teal
  screen: string
  onScreen: (key: string) => void
  onHome: () => void
  lang: string
}

function WorldSidebar({ world, accent, screen, onScreen, onHome, lang }: WorldSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-stone-200/70 flex-col">
      <button onClick={onHome} className="px-4 py-4 border-b border-stone-200/70 flex items-center gap-2.5 hover:bg-stone-50 text-left">
        <div className="w-8 h-8 rounded-lg bg-stone-900 grid place-items-center text-white">
          <span className="text-[13px] font-bold tracking-tighter">jt</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold tracking-tight text-stone-900 leading-tight">
            joinery<span className="text-teal-600">/</span>tech
          </div>
          <div className="text-[10px] text-stone-500 truncate">
            {lang === 'en' ? '\u2190 All workspaces' : '\u2190 Vissza a Home-ra'}
          </div>
        </div>
      </button>

      <div className={`px-4 py-3 border-b border-stone-200/70 ${accent.sideBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconFg} grid place-items-center`}>
            <WorldIcon name={world.icon} size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-stone-900">{lang === 'en' ? world.en : world.hu}</div>
            <div className="text-[10px] text-stone-500">{lang === 'en' ? 'Workspace' : 'Munkavil\u00e1g'}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {world.screens.map((s: WorldScreen) => {
          const active = screen === s.key
          return (
            <button
              key={s.key}
              onClick={() => onScreen(s.key)}
              className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[12.5px] text-left transition ${
                active ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <span className={`w-1 h-4 rounded-full ${active ? accent.sideAccent.replace('border-', 'bg-') : 'bg-transparent'}`} />
              <span className="flex-1 truncate">{lang === 'en' && s.en ? s.en : s.hu}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-stone-200/70 text-[10.5px] text-stone-400 font-mono">v3.2.1</div>
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
        className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 transition"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[10px] font-semibold text-white">
          {initials}
        </div>
        <span className="text-[12px] text-stone-600 max-w-[120px] truncate hidden md:block">{name}</span>
        <Icon name="down" size={11} className="text-stone-400 hidden md:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1">
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <div className="text-[12px] font-medium text-stone-900 truncate">{name}</div>
              {user?.profile?.email && (
                <div className="text-[11px] text-stone-400 truncate">{user.profile.email}</div>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50 transition"
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

interface WorldTopBarProps extends Omit<WorldSidebarProps, 'onScreen'> {
  onMenu: () => void
}

function WorldTopBar({ world, accent, screen, onHome, lang, onMenu }: WorldTopBarProps) {
  const screenObj = world.screens.find((s: WorldScreen) => s.key === screen) ?? world.screens[0]
  const screenLabel = lang === 'en' && screenObj?.en ? screenObj.en : screenObj?.hu

  return (
    <header className="bg-white border-b border-stone-200/70">
      <div className="px-4 md:px-7 py-4 flex items-center gap-3 md:gap-4">
        <button
          onClick={onMenu}
          aria-label="Menü"
          className="md:hidden w-9 h-9 -ml-1 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 shrink-0"
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="md:hidden min-w-0 flex-1">
          <div className={`text-[10px] font-medium ${accent.fg} truncate`}>{lang === 'en' ? world.en : world.hu}</div>
          <div className="text-[14px] font-semibold tracking-tight text-stone-900 leading-tight truncate">{screenLabel}</div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11.5px] text-stone-500">
          <button onClick={onHome} className="hover:text-stone-900">Home</button>
          <Icon name="chevron" size={11} className="text-stone-300" />
          <span className={`${accent.fg} font-medium`}>{lang === 'en' ? world.en : world.hu}</span>
          {screenObj && (
            <>
              <Icon name="chevron" size={11} className="text-stone-300" />
              <span className="text-stone-700 font-medium">{screenLabel}</span>
            </>
          )}
        </div>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <input
              placeholder={lang === 'en' ? 'Search\u2026' : 'Keres\u00e9s\u2026'}
              className="h-8 w-56 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] focus:border-stone-400 focus:ring-1 focus:ring-stone-300 outline-none bg-stone-50/40"
            />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
          <button className="w-8 h-8 grid place-items-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 relative">
            <Icon name="bell" size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>
          <UserMenu lang={lang} />
        </div>
      </div>
      <div className="hidden md:block px-7 pb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-stone-900">{screenLabel}</h1>
      </div>
    </header>
  )
}

interface WorldMobileDrawerProps extends WorldSidebarProps {
  open: boolean
  onClose: () => void
}

function WorldMobileDrawer({ open, onClose, world, accent, screen, onScreen, onHome, lang }: WorldMobileDrawerProps) {
  return (
    <div
      className={`md:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute inset-y-0 left-0 w-[280px] max-w-[82%] bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-4 py-4 border-b border-stone-200/70 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 grid place-items-center text-white shrink-0">
            <span className="text-[13px] font-bold tracking-tighter">jt</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold tracking-tight text-stone-900 leading-tight">
              joinery<span className="text-teal-600">/</span>tech
            </div>
            <div className="text-[10px] text-stone-500 truncate">portál</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-lg text-stone-500 hover:bg-stone-100 -mr-1"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <button
          onClick={() => { onHome(); onClose() }}
          className="px-4 py-3 border-b border-stone-200/70 flex items-center gap-2 text-[12px] text-stone-600 hover:bg-stone-50 text-left"
        >
          <Icon name="chevron" size={14} className="rotate-180" />
          {lang === 'en' ? 'All workspaces' : 'Vissza a Home-ra'}
        </button>

        <div className={`px-4 py-3 border-b border-stone-200/70 ${accent.sideBg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconFg} grid place-items-center`}>
              <WorldIcon name={world.icon} size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-stone-900">{lang === 'en' ? world.en : world.hu}</div>
              <div className="text-[10px] text-stone-500">{lang === 'en' ? 'Workspace' : 'Munkavil\u00e1g'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {world.screens.map((s: WorldScreen) => {
            const active = screen === s.key
            return (
              <button
                key={s.key}
                onClick={() => { onScreen(s.key); onClose() }}
                className={`w-full flex items-center gap-2.5 px-2.5 h-11 rounded-lg text-[13.5px] text-left transition ${
                  active ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className={`w-1 h-4 rounded-full ${active ? accent.sideAccent.replace('border-', 'bg-') : 'bg-transparent'}`} />
                <span className="flex-1 truncate">{lang === 'en' && s.en ? s.en : s.hu}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-stone-200/70 text-[10.5px] text-stone-400 font-mono">v3.2.1</div>
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
  if (!w) return null
  const accent = ACCENT_MAP[w.accent] ?? ACCENT_MAP.teal

  const isShopFloor = worldKey === 'shopfloor'
  const [menuOpen, setMenuOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => { setMenuOpen(false) }, [screen, worldKey])

  // Lock body scroll + Esc to close while drawer is open
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen bg-stone-50/60">
      <WorldSidebar world={w} accent={accent} screen={screen} onScreen={onScreen} onHome={onHome} lang={lang} />
      <main className="flex-1 min-w-0 flex flex-col">
        <WorldTopBar world={w} accent={accent} screen={screen} onHome={onHome} lang={lang} onMenu={() => setMenuOpen(true)} />
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
      {!isShopFloor && <ChatBubble page={`${w.hu} / ${screen}`} />}
    </div>
  )
}

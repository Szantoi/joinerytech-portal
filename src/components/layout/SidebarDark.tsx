import { Icon } from '../ui/Icon'
import { Wordmark, GrainMark } from '../ui/Wordmark'
import { useAuth } from '../../hooks/useAuth'
import type { I18nStrings } from '../../types'

interface NavItem {
  key: string
  icon: string
  badge?: string
  badgeTone?: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', icon: 'dashboard' },
  { key: 'workflow', icon: 'workflow', badge: '13' },
  { key: 'orders', icon: 'orders', badge: '12' },
  { key: 'production', icon: 'production', badge: '6' },
  { key: 'inventory', icon: 'inventory', badge: '3', badgeTone: 'warn' },
  { key: 'procurement', icon: 'procurement' },
  { key: 'analytics', icon: 'analytics' },
  { key: 'settings', icon: 'settings' },
]

export { NAV_ITEMS }

interface SidebarDarkProps {
  current: string
  onNav: (key: string) => void
  t: I18nStrings
}

// Demo fallback for unauthenticated / test mode
const DEMO_USER = { name: 'Kovács Péter', initials: 'KP' }

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export function SidebarDark({ current, onNav, t }: SidebarDarkProps) {
  const { user, logout } = useAuth()
  const displayName = user?.profile?.name ?? user?.profile?.preferred_username ?? DEMO_USER.name
  const displayInitials = displayName !== DEMO_USER.name ? getInitials(displayName) : DEMO_USER.initials

  return (
    <aside className="hidden md:flex bg-[#0b1220] text-white/85 w-[64px] lg:w-[232px] shrink-0 flex-col h-screen sticky top-0 border-r border-white/5">
      <div className="px-4 pt-5 pb-4 hidden lg:block">
        <Wordmark tone="dark" size={15} />
      </div>
      <div className="lg:hidden pt-5 pb-3 grid place-items-center">
        <GrainMark tone="dark" />
      </div>
      <div className="px-3 pb-2 hidden lg:block">
        <div className="bg-white/5 hover:bg-white/8 transition rounded-md px-2.5 py-1.5 flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded bg-teal-500/15 text-teal-300 grid place-items-center text-[11px] font-semibold">
            DS
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium truncate">Doorstar Hungary</div>
            <div className="text-[10.5px] text-white/45 truncate">{'Uzem \u00b7 V\u00e1c'}</div>
          </div>
          <Icon name="down" size={14} className="text-white/40" />
        </div>
      </div>
      <nav className="px-2 mt-2 flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((it) => {
          const active = current === it.key
          return (
            <button
              key={it.key}
              onClick={() => onNav(it.key)}
              title={t.nav[it.key]}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition relative ${
                active ? 'bg-white/8 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-teal-300" />}
              <Icon name={it.icon} size={17} className={active ? 'text-teal-300' : 'text-white/55 group-hover:text-white/80'} />
              <span className="hidden lg:inline flex-1 text-left">{t.nav[it.key]}</span>
              {it.badge && (
                <span
                  className={`hidden lg:inline text-[10px] px-1.5 py-0.5 rounded ${
                    it.badgeTone === 'warn' ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-white/65'
                  }`}
                >
                  {it.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-white/5 p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[11px] font-semibold text-white">
          {displayInitials}
        </div>
        <div className="hidden lg:block min-w-0 flex-1">
          <div className="text-[12.5px] font-medium truncate">{displayName}</div>
          <div className="text-[10.5px] text-white/45 truncate">Admin &middot; Doorstar</div>
        </div>
        <button onClick={logout} className="hidden lg:inline-flex text-white/45 hover:text-white/80" title="Kijelentkezés">
          <Icon name="logout" size={15} />
        </button>
      </div>
    </aside>
  )
}

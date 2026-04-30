import { Icon, Card } from '../ui'
import { WorldIcon } from './WorldIcon'
import { ACCENT_MAP } from './WorldShell'
import { WORLDS, WORLD_ORDER } from '../../mocks/worlds'
import { useAuth } from '../../hooks/useAuth'
import type { WorldKey } from '../../types'

interface Notification {
  type: string
  when: string
  text: string
  world: string
  screen: string
}

const NOTIFICATIONS: Notification[] = [
  { type: 'stock', when: '10 perccel ezel\u0151tt', text: 'Vasalat Blum CLIP top \u2014 k\u00e9szlet kritikus szint al\u00e1 esett (4 db)', world: 'warehouse', screen: 'inventory' },
  { type: 'order', when: '1 \u00f3r\u00e1ja', text: '\u00daj aj\u00e1nlat elfogadva: Doorstar Hungary Zrt. \u2014 JT-2426-0182 (12.4M Ft)', world: 'sales', screen: 'orders' },
  { type: 'machine', when: '2 \u00f3r\u00e1ja', text: 'Holzma HPP380 \u00b7 CP-184-A elk\u00e9sz\u00fclt \u00b7 proof felt\u00f6ltve', world: 'production', screen: 'cutting' },
  { type: 'design', when: 'Tegnap', text: '\u00daj sablon publik\u00e1lva: Konyhai als\u00f3 szekr\u00e9ny (fi\u00f3kos) v2.1', world: 'design', screen: 'editor' },
  { type: 'delivery', when: 'Tegnap', text: 'PO-2426-091 meg\u00e9rkezett \u2014 30 db T\u00f6lgy 22mm', world: 'warehouse', screen: 'procurement' },
]

const DOT_COLORS: Record<string, string> = {
  stock: 'bg-amber-500',
  order: 'bg-emerald-500',
  machine: 'bg-teal-500',
  design: 'bg-indigo-500',
  delivery: 'bg-sky-500',
}

interface HomeScreenProps {
  onEnter: (world: string, screen?: string) => void
  lang?: string
}

export function HomeScreen({ onEnter, lang = 'hu' }: HomeScreenProps) {
  const { user } = useAuth()
  const greeting = lang === 'en' ? 'Good morning' : 'J\u00f3 reggelt'
  const me = user.name
  const subtitle = lang === 'en' ? 'Choose a workspace' : 'V\u00e1lassz egy munkavil\u00e1got'
  const recent = lang === 'en' ? 'Recent activity' : 'Legut\u00f3bbi tev\u00e9kenys\u00e9g'
  const enabledModules = WORLD_ORDER

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-teal-50/30">
      <header className="px-8 py-5 flex items-center justify-between border-b border-stone-200/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 grid place-items-center text-white">
            <span className="text-[16px] font-bold tracking-tighter">jt</span>
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">
              joinery<span className="text-teal-600">/</span>tech
            </div>
            <div className="text-[10.5px] text-stone-500 -mt-0.5">port\u00e1l</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-stone-500">{lang === 'en' ? 'Logged in as' : 'Bejelentkezve'}</div>
            <div className="text-[12px] font-medium text-stone-900">{user.name} &middot; Admin</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[11px] font-semibold text-white">
            {user.initials}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-8 pt-12 pb-6">
        <div className="text-[12px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-2">
          {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'hu-HU', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-[44px] font-semibold tracking-tight text-stone-900 leading-tight">
          {greeting}, {me}.
        </h1>
        <p className="text-[16px] text-stone-500 mt-1">{subtitle}.</p>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {enabledModules.filter((k): k is WorldKey => k in WORLDS).map((key) => {
            const w = WORLDS[key]
            const accent = ACCENT_MAP[w.accent] ?? ACCENT_MAP.teal
            return (
              <button
                key={key}
                onClick={() => onEnter(key)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-[0_8px_24px_-6px_rgba(28,25,23,.12)] transition text-left p-6 min-h-[200px] flex flex-col"
              >
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${accent.tint} opacity-50 group-hover:opacity-90 transition`} />
                <div className={`relative w-12 h-12 rounded-xl ${accent.iconBg} ${accent.iconFg} grid place-items-center mb-5`}>
                  <WorldIcon name={w.icon} size={24} />
                </div>
                <div className="relative">
                  <div className="text-[19px] font-semibold tracking-tight text-stone-900">{lang === 'en' ? w.en : w.hu}</div>
                  <div className="text-[12px] text-stone-500 mt-1 leading-snug">{w.sub}</div>
                </div>
                <div className="flex-1" />
                <div className="relative flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
                  {w.badge ? <span className={`text-[11px] font-medium ${accent.fg}`}>{w.badge}</span> : <span />}
                  <span className="text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition">
                    <Icon name="chevron" size={16} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-3">{recent}</div>
          <Card className="p-0 overflow-hidden">
            {NOTIFICATIONS.map((n, i) => (
              <button
                key={i}
                onClick={() => onEnter(n.world, n.screen)}
                className="w-full grid grid-cols-[20px_1fr_120px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center text-left hover:bg-stone-50/70"
              >
                <div className={`w-2 h-2 rounded-full ${DOT_COLORS[n.type] ?? 'bg-stone-400'}`} />
                <div className="text-[12.5px] text-stone-800 truncate">{n.text}</div>
                <div className="text-[10.5px] text-stone-400 font-mono text-right">{n.when}</div>
              </button>
            ))}
          </Card>
        </div>
      </div>

      <footer className="text-center py-6 text-[10.5px] text-stone-400 font-mono">v3.2.1 &middot; 2026</footer>
    </div>
  )
}

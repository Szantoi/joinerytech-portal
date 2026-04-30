import { Icon } from '../ui/Icon'
import type { I18nStrings } from '../../types'

interface MobileBottomNavProps {
  current: string
  onNav: (key: string) => void
  t: I18nStrings
}

const MOBILE_ITEMS = [
  { key: 'dashboard', icon: 'dashboard' },
  { key: 'workflow', icon: 'workflow' },
  { key: 'production', icon: 'production' },
  { key: 'settings', icon: 'settings' },
]

export function MobileBottomNav({ current, onNav, t }: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {MOBILE_ITEMS.map((it) => {
        const active = current === it.key
        return (
          <button
            key={it.key}
            onClick={() => onNav(it.key)}
            className={`flex flex-col items-center gap-0.5 py-2 ${active ? 'text-teal-700' : 'text-stone-500'}`}
          >
            <Icon name={it.icon} size={18} />
            <span className="text-[9.5px] font-medium">{t.nav[it.key]}</span>
          </button>
        )
      })}
    </nav>
  )
}

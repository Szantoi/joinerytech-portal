import { Icon } from '../ui/Icon'
import type { I18nStrings } from '../../types'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  t: I18nStrings
}

export function TopBarFlat({ title, subtitle, actions, t }: TopBarProps) {
  return (
    <header className="bg-white/85 backdrop-blur sticky top-0 z-20 border-b border-stone-200/80">
      <div className="flex items-center gap-4 px-7 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-stone-900 leading-tight truncate">{title}</div>
          {subtitle && <div className="text-[12px] text-stone-500 leading-tight mt-0.5 truncate">{subtitle}</div>}
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 h-9 w-[280px] rounded-lg bg-stone-100/80 border border-stone-200/60 text-stone-500">
          <Icon name="search" size={15} />
          <input
            placeholder={t.common.search}
            className="bg-transparent outline-none text-[12.5px] flex-1 placeholder:text-stone-400"
          />
          <span className="text-[10px] text-stone-400 border border-stone-300 rounded px-1 py-px">{'\u2318K'}</span>
        </div>
        <button className="w-9 h-9 grid place-items-center rounded-lg text-stone-500 hover:bg-stone-100 relative">
          <Icon name="bell" size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-teal-500" />
        </button>
        {actions}
      </div>
    </header>
  )
}

import { Icon } from '../ui/Icon'
import { ThemeQuickToggle } from './ThemeToggle'
import type { I18nStrings } from '../../types'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  t: I18nStrings
}

export function TopBarFlat({ title, subtitle, actions, t }: TopBarProps) {
  return (
    <header className="bg-surface-1/85 backdrop-blur sticky top-0 z-20 border-b border-line/80">
      <div className="flex items-center gap-4 px-7 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink leading-tight truncate">{title}</div>
          {subtitle && <div className="text-[12px] text-ink-soft leading-tight mt-0.5 truncate">{subtitle}</div>}
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 h-9 w-[280px] rounded-lg bg-surface-2/80 border border-line/60 text-ink-soft">
          <Icon name="search" size={15} />
          <input
            placeholder={t.common.search}
            className="bg-transparent outline-none text-[12.5px] flex-1 text-ink placeholder:text-ink-soft"
          />
          <span className="text-[10px] text-ink-soft border border-line-strong rounded px-1 py-px">{'⌘K'}</span>
        </div>
        <button className="w-9 h-9 grid place-items-center rounded-lg text-ink-soft hover:bg-surface-2 relative">
          <Icon name="bell" size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-teal-500" />
        </button>
        <ThemeQuickToggle className="w-9 h-9 border-transparent" />
        {actions}
      </div>
    </header>
  )
}

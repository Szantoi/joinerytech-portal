import { Icon } from './Icon'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  icon?: string
}

export function PrimaryBtn({ children, onClick, icon }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-teal-700 dark:bg-teal-600 text-white text-[12.5px] font-medium hover:bg-teal-800 dark:hover:bg-teal-700 active:scale-[.99] transition shadow-sm shadow-teal-900/10"
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

export function GhostBtn({ children, onClick, icon }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-[12.5px] font-medium hover:bg-stone-50 dark:hover:bg-stone-700"
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

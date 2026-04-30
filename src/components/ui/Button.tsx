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
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-teal-700 text-white text-[12.5px] font-medium hover:bg-teal-800 active:scale-[.99] transition shadow-sm shadow-teal-900/10"
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
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white border border-stone-200 text-stone-700 text-[12.5px] font-medium hover:bg-stone-50"
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

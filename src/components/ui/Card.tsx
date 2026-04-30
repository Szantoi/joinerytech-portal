import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export function Card({ children, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-stone-200/80 rounded-xl',
        interactive && 'hover:border-stone-300 transition cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

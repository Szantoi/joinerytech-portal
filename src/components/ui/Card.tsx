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
        'bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 rounded-xl',
        interactive && 'hover:border-stone-300 dark:hover:border-stone-600 transition cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

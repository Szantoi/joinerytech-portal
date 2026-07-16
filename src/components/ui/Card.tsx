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
        // Szemantikus tokenek (design-system/dark-mode.html): kártya = surface-card,
        // keret = border. Sötétben a border teljes erővel tagol (a shadow eltűnik).
        'bg-surface-card border border-line/80 dark:border-line rounded-xl',
        interactive && 'hover:border-line-strong transition cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  tone?: 'teal' | 'amber' | 'rose' | 'emerald'
}

const TONE_MAP: Record<string, string> = {
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
}

export function ProgressBar({ value, max = 100, className, tone = 'teal' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-stone-100', className)}>
      <div className={cn('h-full rounded-full transition-all', TONE_MAP[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

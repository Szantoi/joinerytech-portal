import { useState } from 'react'
import { Card } from './Card'
import { Sparkline } from './Sparkline'
import { Icon } from './Icon'

interface KpiBreakdown {
  label: string
  value: string
  note?: string
}

interface KpiCardProps {
  /** Main label / title */
  title?: string
  label?: string
  value: string
  unit?: string
  change?: string
  changeDirection?: 'up' | 'down'
  /** Numeric delta percentage (alternative to change string) */
  delta?: number
  spark?: number[]
  sparkColor?: string
  breakdowns?: KpiBreakdown[]
}

export function KpiCard({
  title,
  label,
  value,
  unit,
  change,
  changeDirection,
  delta,
  spark,
  sparkColor = 'var(--acc-mid)',  // token: világ-akcent chart-szín (light: paletta-hű, dark: oklch-recept)
  breakdowns,
}: KpiCardProps) {
  const [open, setOpen] = useState(false)

  // Support both `title` (legacy) and `label` (reference)
  const displayLabel = label ?? title ?? ''

  // Derive delta display from either `delta` number or legacy `change` string
  const hasDelta = delta !== undefined
  const deltaPositive = hasDelta ? delta >= 0 : changeDirection === 'up'
  const deltaText = hasDelta ? `${Math.abs(delta)}%` : change

  return (
    <Card className="overflow-hidden">
      <button
        onClick={breakdowns?.length ? () => setOpen(!open) : undefined}
        className={`w-full text-left p-4 transition ${breakdowns?.length ? 'hover:bg-surface-sunken/60 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] uppercase tracking-wide text-ink-soft font-medium">{displayLabel}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[26px] font-semibold text-ink tabular-nums tracking-tight">{value}</span>
              {unit && <span className="text-[12px] text-ink-soft">{unit}</span>}
            </div>
            {deltaText && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <span className={`inline-flex items-center gap-0.5 ${deltaPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  <Icon name={deltaPositive ? 'up' : 'down'} size={11} />
                  {deltaText}
                </span>
                <span className="text-ink-soft">előző héthez</span>
              </div>
            )}
          </div>
          {spark && (
            <div className="shrink-0">
              <Sparkline data={spark} width={88} height={36} stroke={sparkColor} fill={sparkColor} strokeWidth={1.8} />
            </div>
          )}
        </div>
        {breakdowns && breakdowns.length > 0 && (
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-soft">
            <span>{open ? 'Bezárás' : 'Részletek'}</span>
            <Icon name={open ? 'up' : 'down'} size={13} />
          </div>
        )}
      </button>
      {open && breakdowns && breakdowns.length > 0 && (
        <div className="border-t border-line/80 bg-surface-sunken/40 p-4 grid grid-cols-3 gap-3 text-[11.5px]">
          {breakdowns.map((b) => (
            <div key={b.label} className="bg-surface-card rounded-lg border border-line/70 p-3">
              <div className="text-ink-soft text-[10.5px] uppercase tracking-wide">{b.label}</div>
              <div className="mt-1 text-[16px] font-semibold text-ink tabular-nums">{b.value}</div>
              {b.note && <div className="text-ink-soft mt-0.5 text-[10.5px]">{b.note}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

import { useState } from 'react'
import { Card } from './Card'
import { Sparkline } from './Sparkline'
import { Icon } from './Icon'

interface KpiBreakdown {
  label: string
  value: string
}

interface KpiCardProps {
  title: string
  value: string
  change?: string
  changeDirection?: 'up' | 'down'
  spark?: number[]
  breakdowns?: KpiBreakdown[]
}

export function KpiCard({ title, value, change, changeDirection, spark, breakdowns }: KpiCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{title}</div>
          <div className="text-[22px] font-semibold text-stone-900 leading-tight mt-1">{value}</div>
          {change && (
            <div className={`text-[11px] mt-1 ${changeDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change}
            </div>
          )}
        </div>
        {spark && (
          <div className="shrink-0 text-teal-600">
            <Sparkline data={spark} width={72} height={28} stroke="currentColor" />
          </div>
        )}
      </div>
      {breakdowns && breakdowns.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="mt-3 flex items-center gap-1 text-[10.5px] text-stone-500 hover:text-stone-700"
          >
            <Icon name={open ? 'up' : 'down'} size={12} />
            {open ? 'Bezárás' : 'Részletek'}
          </button>
          {open && (
            <div className="mt-2 pt-2 border-t border-stone-100 space-y-1">
              {breakdowns.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-[11.5px]">
                  <span className="text-stone-500">{b.label}</span>
                  <span className="font-medium text-stone-700">{b.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}

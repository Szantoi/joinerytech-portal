import { useState } from 'react'
import { Card, Icon } from '../../components/ui'
import { useVariance, type VarianceRow } from '../../services/controlling'
import { QueryGate } from '../ehs/QueryGate'
import { VariancePill } from './MarginVisuals'
import { CATEGORY_LABELS, formatHuf, formatPct } from './labels'

/**
 * Eltérés-elemzés — kategóriánkénti terv vs. tény sávok a teljes portfólióra,
 * kategóriánként lenyitható projekt drill-down listával.
 */

function CategoryRow({ row, max }: { row: VarianceRow; max: number }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[minmax(120px,180px)_1fr_auto_auto] items-center gap-3 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
      >
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
          <Icon name="chevron" size={12}
            className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-90' : ''}`} />
          {CATEGORY_LABELS[row.category]}
        </span>
        <span aria-hidden="true" className="hidden space-y-1 sm:block">
          <span className="block h-2 rounded-full bg-ink/15" style={{ width: `${(row.plan / max) * 100}%` }} />
          <span
            className={`block h-2 rounded-full ${row.actual > row.plan ? 'bg-rose-400' : 'bg-slate-500'}`}
            style={{ width: `${(row.actual / max) * 100}%` }}
          />
        </span>
        <span className="text-right text-[11px] tabular-nums text-ink-muted">
          <span className="block">terv {formatHuf(row.plan)}</span>
          <span className="block font-medium text-ink">tény {formatHuf(row.actual)}</span>
        </span>
        <VariancePill value={row.variance} />
      </button>

      {open && (
        <ul className="mt-2 divide-y divide-line/50 rounded-lg bg-surface-2/50 px-3">
          {row.projects.map((p) => (
            <li key={p.projectId} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[12px] text-ink">{p.name}</div>
                <div className="font-mono text-[10px] text-ink-muted">{p.projectId}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-[10.5px] tabular-nums text-ink-muted sm:inline">
                  {formatHuf(p.plan)} → {formatHuf(p.actual)}
                </span>
                <VariancePill value={p.variance} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function VarianceScreen() {
  const variance = useVariance()
  const rows = variance.data ?? []
  const max = Math.max(1, ...rows.flatMap((r) => [r.plan, r.actual]))
  const total = rows.reduce((s, r) => s + r.variance, 0)
  const totalPlan = rows.reduce((s, r) => s + r.plan, 0)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Eltérés-elemzés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Terv vs. tény kategóriánként — halvány sáv: terv, színes sáv: tény; kattintásra projekt-bontás
        </p>
      </div>

      <QueryGate isPending={variance.isPending} isError={variance.isError}
        onRetry={() => void variance.refetch()} resource="eltérés-elemzés">
        <Card className="px-4 py-1">
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <CategoryRow key={row.category} row={row} max={max} />
            ))}
          </ul>
        </Card>
        <p className="mt-3 text-right text-[12px] text-ink-muted">
          Portfólió-eltérés összesen:{' '}
          <span className={`font-semibold tabular-nums ${total > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {total > 0 ? '+' : total < 0 ? '−' : ''}{formatHuf(Math.abs(total))}
          </span>{' '}
          ({formatPct(totalPlan > 0 ? total / totalPlan : null)} a tervhez képest)
        </p>
      </QueryGate>
    </div>
  )
}

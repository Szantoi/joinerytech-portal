import { Suspense, lazy } from 'react'
import { Button, Card, QueryGate } from '../../../components/ui'
import { AT_RISK_MARGIN_THRESHOLD, usePortfolioSummary } from '../services'
import { MarginPill } from './MarginVisuals'
import { formatHufM, formatPct } from './labels'

/**
 * Vezetői áttekintés — portfólió KPI-kártyák + fedezet-trend (recharts,
 * KÜLÖN lazy chunk) + kockázatos projektek listája.
 */

const MarginTrendChart = lazy(() => import('./MarginTrendChart'))

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'danger' | 'success' }) {
  return (
    <Card className="p-4">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div
        className={`mt-1 text-[22px] font-semibold tabular-nums leading-none tracking-tight ${
          tone === 'danger' ? 'text-rose-700 dark:text-rose-400' : tone === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[10.5px] text-ink-muted">{sub}</div>}
    </Card>
  )
}

export function DashboardScreen({ onScreen }: { onScreen: (screen: string) => void }) {
  const summary = usePortfolioSummary()
  const s = summary.data

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Kontrolling</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Projekt-jövedelmezőség — terv vs. tény, EAC-vetítéssel
        </p>
      </div>

      <QueryGate isPending={summary.isPending} isError={summary.isError}
        onRetry={() => void summary.refetch()} resource="portfólió-összegzés">
        {s && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Portfólió érték" value={formatHufM(s.contractTotal)}
                sub={`${s.projectCount} projekt · számlázva ${formatHufM(s.invoicedTotal)}`} />
              <Kpi label="EAC-fedezet" value={formatPct(s.eacMarginPct)}
                sub={`Terv: ${formatPct(s.planMarginPct)} · tény: ${formatPct(s.actualMarginPct)}`}
                tone={(s.eacMarginPct ?? 0) < AT_RISK_MARGIN_THRESHOLD ? 'danger' : 'success'} />
              {/* Küszöb a configból (M2) — a KPI-tónus és a felirat nem szakadhat el
                  az MSW-oldali besorolástól (mindkettő AT_RISK_MARGIN_THRESHOLD). */}
              <Kpi label="Kockázatos projekt" value={String(s.projectsAtRisk)}
                sub={`EAC-fedezet a ${formatPct(AT_RISK_MARGIN_THRESHOLD)}-os küszöb alatt`}
                tone={s.projectsAtRisk > 0 ? 'danger' : 'success'} />
              <Kpi label="EAC-túllépés" value={`${s.eacOverrunCount} db`}
                sub={`Terv feletti vetítés: ${formatHufM(s.eacOverrunTotal)}`}
                tone={s.eacOverrunCount > 0 ? 'danger' : 'success'} />
            </div>

            <Card className="p-5">
              <h2 className="mb-3 text-[13px] font-semibold text-ink">Fedezet-trend (terv vs. tény)</h2>
              <Suspense fallback={<div aria-busy="true" className="h-[220px] animate-pulse rounded-xl bg-surface-2" />}>
                <MarginTrendChart trend={s.marginTrend} />
              </Suspense>
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Kockázatos projektek</h2>
                <Button variant="quiet" size="sm" onClick={() => onScreen('portfolio')}>
                  Portfólió megnyitása
                </Button>
              </div>
              {s.atRiskProjects.length === 0 ? (
                <p className="text-[12.5px] text-ink-muted">Nincs kockázatos projekt — minden fedezet a küszöb felett van.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {s.atRiskProjects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-ink">{p.name}</div>
                        <div className="font-mono text-[10.5px] text-ink-muted">{p.id}</div>
                      </div>
                      <MarginPill pct={p.eacMarginPct} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </QueryGate>
    </div>
  )
}

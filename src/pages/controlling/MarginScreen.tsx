import { useState } from 'react'
import { Card, StatusPill } from '../../components/ui'
import { useProjects, type ProjectSummary } from '../../services/controlling'
import { QueryGate } from '../ehs/QueryGate'
import { MarginBar, MarginPill, VariancePill } from './MarginVisuals'
import { CATEGORY_LABELS, PROJECT_STATUS_LABELS, formatHuf, formatHufM, formatPct } from './labels'
import { ProjectDetailSlideOver } from './ProjectDetailSlideOver'

/**
 * Projekt-fedezet — projektenkénti fedezet-nézet: fedezet-sáv (EAC alapon),
 * terv/tény/EAC fedezet-százalékok és kategória-bontás (anyag/munka/rezsi…)
 * terv vs. tény mini-sávokkal. Kattintásra részlet-SlideOver.
 */

function CategoryBars({ project }: { project: ProjectSummary }) {
  const max = Math.max(1, ...project.byCategory.flatMap((c) => [c.plan, c.actual]))
  return (
    <dl className="space-y-1.5">
      {project.byCategory.map((c) => (
        <div key={c.category} className="grid grid-cols-[110px_1fr_auto] items-center gap-2">
          <dt className="truncate text-[10.5px] text-ink-muted">{CATEGORY_LABELS[c.category]}</dt>
          <dd aria-hidden="true" className="space-y-0.5">
            <div className="h-1.5 rounded-full bg-ink/15" style={{ width: `${(c.plan / max) * 100}%` }} />
            <div
              className={`h-1.5 rounded-full ${c.actual > c.plan ? 'bg-rose-400' : 'bg-slate-500'}`}
              style={{ width: `${(c.actual / max) * 100}%` }}
            />
          </dd>
          <dd className="text-right text-[10.5px] tabular-nums text-ink-muted">
            <span className="sr-only">terv </span>{formatHuf(c.plan)}
            <span aria-hidden="true"> / </span>
            <span className="sr-only">tény </span>
            <span className="font-medium text-ink">{formatHuf(c.actual)}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function MarginScreen() {
  const projects = useProjects()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Projekt-fedezet</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Kategóriánkénti bontás — halvány sáv: terv, színes sáv: tény (piros: terv felett)
        </p>
      </div>

      <QueryGate isPending={projects.isPending} isError={projects.isError}
        onRetry={() => void projects.refetch()} resource="projekt-fedezet">
        <div className="grid gap-3 md:grid-cols-2">
          {(projects.data ?? []).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedId(p.id)}
                  className="rounded text-left text-[13px] font-semibold text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                >
                  {p.name}
                </button>
                <StatusPill size="sm" fsm="kontrollingProjekt" status={p.status} label={PROJECT_STATUS_LABELS[p.status]} />
              </div>
              <div className="mb-2 text-[11.5px] text-ink-muted">
                {p.customer} · {formatHufM(p.contractValue)}
              </div>

              <MarginBar revenue={p.contractValue} cost={p.eacTotal} />

              <dl className="mt-2 mb-3 grid grid-cols-3 gap-2 text-[11px]">
                {([
                  ['Terv-fedezet', p.planMarginPct],
                  ['Tény-fedezet', p.actualMarginPct],
                  ['EAC-fedezet', p.eacMarginPct],
                ] as const).map(([label, pct]) => (
                  <div key={label}>
                    <dt className="text-[10px] text-ink-muted">{label}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{formatPct(pct)}</dd>
                  </div>
                ))}
              </dl>

              <CategoryBars project={p} />

              <div className="mt-3 flex items-center justify-between">
                <MarginPill pct={p.eacMarginPct} />
                <VariancePill value={p.variance} />
              </div>
            </Card>
          ))}
        </div>
      </QueryGate>

      <ProjectDetailSlideOver projectId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

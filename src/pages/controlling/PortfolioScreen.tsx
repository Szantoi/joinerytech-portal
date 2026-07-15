import { useState } from 'react'
import { DataTable, Icon, StatusPill, type DataTableColumn } from '../../components/ui'
import { useProjects, type ProjectStatus, type ProjectSummary } from '../../services/controlling'
import { QueryGate } from '../ehs/QueryGate'
import { MarginPill, VariancePill } from './MarginVisuals'
import { PROJECT_STATUS_LABELS, formatHufM } from './labels'
import { ProjectDetailSlideOver } from './ProjectDetailSlideOver'

/**
 * Portfólió — DataTable (kettős render) életciklus-pillekkel (címkék, nem FSM),
 * státusz-szűrővel; sor-cím kattintásra részlet-SlideOver.
 */

const FILTERS = ['all', 'draft', 'active', 'install', 'done', 'on_hold'] as const
type Filter = (typeof FILTERS)[number]

export function PortfolioScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const projects = useProjects(filter === 'all' ? {} : { status: filter })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const contractTotal = (projects.data ?? []).reduce((s, p) => s + p.contractValue, 0)

  const columns: DataTableColumn<ProjectSummary>[] = [
    {
      key: 'name', header: 'Projekt', sortable: true, mobile: 'title',
      sortValue: (p) => p.name,
      render: (p) => (
        <button
          onClick={() => setSelectedId(p.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[220px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {p.name}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">{p.id}</span>
        </button>
      ),
    },
    { key: 'customer', header: 'Ügyfél', sortable: true, sortValue: (p) => p.customer, render: (p) => p.customer },
    {
      key: 'status', header: 'Státusz',
      render: (p) => (
        <StatusPill size="sm" fsm="kontrollingProjekt" status={p.status} label={PROJECT_STATUS_LABELS[p.status]} />
      ),
    },
    {
      key: 'contractValue', header: 'Érték', sortable: true,
      sortValue: (p) => p.contractValue,
      render: (p) => <span className="font-semibold tabular-nums">{formatHufM(p.contractValue)}</span>,
    },
    {
      key: 'eacTotal', header: 'EAC-költség', sortable: true, mobile: 'hidden',
      sortValue: (p) => p.eacTotal,
      render: (p) => <span className="tabular-nums text-ink-muted">{formatHufM(p.eacTotal)}</span>,
    },
    {
      key: 'eacMarginPct', header: 'Fedezet (EAC)', sortable: true,
      sortValue: (p) => p.eacMarginPct,
      render: (p) => <MarginPill pct={p.eacMarginPct} />,
    },
    { key: 'variance', header: 'Eltérés', mobile: 'meta', render: (p) => <VariancePill value={p.variance} /> },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Portfólió</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Projekt-életciklus címkék: vázlat → folyamatban → beépítés → kész (+áll) — nem szigorú FSM
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {FILTERS.map((s) => (
            // Aktív jelzés nem csak színnel (spec §3.3 chip-sor: pipa-ikon + vastagabb
            // súly); a 28 px-es pill körül before-pszeudóval 44 px-es touch-célfelület
            // (CRM LeadsScreen.tsx:79-95 minta).
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                filter === s
                  ? 'bg-world font-semibold text-world-fg'
                  : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {filter === s && (
                <span aria-hidden="true" className="inline-flex">
                  <Icon name="check" size={12} />
                </span>
              )}
              {s === 'all' ? 'Mind' : PROJECT_STATUS_LABELS[s as ProjectStatus]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(projects.data ?? []).length} db · <span className="font-semibold tabular-nums">{formatHufM(contractTotal)}</span>
        </div>
      </div>

      <QueryGate isPending={projects.isPending} isError={projects.isError}
        onRetry={() => void projects.refetch()} resource="portfólió">
        <DataTable
          columns={columns}
          rows={projects.data ?? []}
          rowKey={(p) => p.id}
          caption="Projekt-portfólió státusszal, értékkel, EAC-költséggel és fedezettel"
          emptyMessage="Nincs a szűrésnek megfelelő projekt."
        />
      </QueryGate>

      <ProjectDetailSlideOver projectId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

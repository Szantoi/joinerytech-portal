import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../components/ui'
import { useInspections, type InspectionStatus } from '../../services/qa'
import type { Inspection } from '../../services/qa/inspections'
import {
  CHECKPOINT_TYPE_META, CRITICAL_LEVEL_META, INSPECTION_STATUS_LABELS, formatDate,
} from './labels'
import { InspectionDetailSlideOver } from './InspectionDetailSlideOver'

/**
 * Átvizsgálások — DataTable (kettős render), státusz-szűrő chipekkel
 * (szerver-oldali; a „Nyitott" a nevesített INSPECTION_OPEN_STATUSES guard
 * szerver-oldali tükre: open=true); sor-cím kattintásra részlet-SlideOver a
 * checklist-tel és az átvizsgálás-FSM akciókkal (megkezdés/megfelelt/selejt).
 */

const FILTERS = ['open', 'all', 'nyitott', 'folyamatban', 'megfelelt', 'selejt'] as const
type Filter = (typeof FILTERS)[number]

function filterToQuery(filter: Filter) {
  if (filter === 'all') return {}
  if (filter === 'open') return { open: true }
  return { status: filter }
}

export function InspectionsScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const inspections = useInspections(filterToQuery(filter))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: DataTableColumn<Inspection>[] = [
    {
      key: 'checkpoint', header: 'Átvizsgálás', sortable: true, mobile: 'title',
      sortValue: (i) => i.checkpointName,
      render: (i) => (
        <button
          onClick={() => setSelectedId(i.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[240px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {i.checkpointName}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">
            {i.id} · {i.productName ?? i.orderRef ?? '—'}
          </span>
        </button>
      ),
    },
    {
      key: 'type', header: 'Pont típusa', mobile: 'meta',
      render: (i) => (
        <StatusPill size="sm" tone={CHECKPOINT_TYPE_META[i.checkpointType].tone} label={CHECKPOINT_TYPE_META[i.checkpointType].label} />
      ),
    },
    {
      key: 'criticalLevel', header: 'Kritikusság', mobile: 'meta',
      render: (i) => (
        <StatusPill size="sm" tone={CRITICAL_LEVEL_META[i.criticalLevel].tone} label={CRITICAL_LEVEL_META[i.criticalLevel].label} />
      ),
    },
    {
      key: 'inspector', header: 'Ellenőr', mobile: 'hidden',
      render: (i) => <span className="text-[11.5px] text-ink-muted">{i.inspectorName}</span>,
    },
    {
      key: 'plannedAt', header: 'Tervezett', sortable: true, mobile: 'hidden',
      sortValue: (i) => i.plannedAt,
      render: (i) => (
        <span className="font-mono text-[11.5px] text-ink">{formatDate(i.plannedAt)}</span>
      ),
    },
    {
      key: 'completedAt', header: 'Lezárva', sortable: true, mobile: 'hidden',
      sortValue: (i) => i.completedAt ?? '',
      render: (i) => (
        <span className="text-[11.5px] text-ink-muted">{formatDate(i.completedAt)}</span>
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (i) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusPill size="sm" fsm="qaEllenorzes" status={i.status} label={INSPECTION_STATUS_LABELS[i.status]} />
          {i.blocking && (
            <span aria-label="Gyártás-blokkoló" title="Gyártás-blokkoló"
              className="text-rose-600 dark:text-rose-400">
              <Icon name="alert" size={13} />
            </span>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Átvizsgálások</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Nyitott → folyamatban → megfelelt (+selejt hibajegyzetekkel; kritikus ponton gyártás-blokkoló)
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {FILTERS.map((s) => (
            // S2-minta: pipa + font-semibold + 44 px touch-cél before-pszeudóval.
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
              {s === 'all' ? 'Mind' : s === 'open' ? 'Nyitott (aktív)' : INSPECTION_STATUS_LABELS[s as InspectionStatus]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(inspections.data ?? []).length} átvizsgálás
        </div>
      </div>

      <QueryGate isPending={inspections.isPending} isError={inspections.isError}
        onRetry={() => void inspections.refetch()} resource="átvizsgálások">
        <DataTable
          columns={columns}
          rows={inspections.data ?? []}
          rowKey={(i) => i.id}
          caption="Átvizsgálások ellenőrzési ponttal, kritikussággal és FSM-státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő átvizsgálás."
        />
      </QueryGate>

      <InspectionDetailSlideOver inspectionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

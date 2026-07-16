import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../../components/ui'
import { useWorkOrders, type WorkOrderStatus } from '../services'
import type { WorkOrder } from '../services/workOrders'
import {
  WO_PRIORITY_META, WO_STATUS_LABELS, WO_TYPE_META, formatDate,
} from './labels'
import { WorkOrderDetailSlideOver } from './WorkOrderDetailSlideOver'

/**
 * Munkalapok — DataTable (kettős render), státusz-szűrő chipekkel
 * (szerver-oldali; a „Nyitott" a nevesített WORK_ORDER_OPEN_STATUSES guard
 * szerver-oldali tükre: open=true); sor-cím kattintásra részlet-SlideOver a
 * munkalap-FSM akciókkal (ütemezés/hozzárendelés/megkezdés/lezárás/halasztás/
 * elutasítás/újranyitás).
 */

const FILTERS = [
  'open', 'all', 'bejelentve', 'utemezve', 'folyamatban', 'kesz', 'halasztva', 'elutasitva',
] as const
type Filter = (typeof FILTERS)[number]

function filterToQuery(filter: Filter) {
  if (filter === 'all') return {}
  if (filter === 'open') return { open: true }
  return { status: filter }
}

export function WorkOrdersScreen() {
  const [filter, setFilter] = useState<Filter>('open')
  const workOrders = useWorkOrders(filterToQuery(filter))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: DataTableColumn<WorkOrder>[] = [
    {
      key: 'title', header: 'Munkalap', sortable: true, mobile: 'title',
      sortValue: (wo) => wo.title,
      render: (wo) => (
        <button
          onClick={() => setSelectedId(wo.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[240px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {wo.title}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">
            {wo.id} · {wo.assetName}
          </span>
        </button>
      ),
    },
    {
      key: 'type', header: 'Típus', mobile: 'meta',
      render: (wo) => (
        <StatusPill size="sm" tone={WO_TYPE_META[wo.type].tone} label={WO_TYPE_META[wo.type].label} />
      ),
    },
    {
      key: 'priority', header: 'Prioritás', mobile: 'meta',
      render: (wo) => (
        <StatusPill size="sm" tone={WO_PRIORITY_META[wo.priority].tone} label={WO_PRIORITY_META[wo.priority].label} />
      ),
    },
    {
      key: 'reportedAt', header: 'Bejelentve', sortable: true, mobile: 'hidden',
      sortValue: (wo) => wo.reportedAt,
      render: (wo) => <span className="text-[11.5px] text-ink-muted">{formatDate(wo.reportedAt)}</span>,
    },
    {
      key: 'scheduledAt', header: 'Ütemezve', sortable: true, mobile: 'hidden',
      sortValue: (wo) => wo.scheduledAt ?? '',
      render: (wo) => (
        <span className="font-mono text-[11.5px] text-ink">{formatDate(wo.scheduledAt)}</span>
      ),
    },
    {
      key: 'assignee', header: 'Felelős', mobile: 'hidden',
      render: (wo) => (
        <span className="text-[11.5px] text-ink-muted">{wo.assigneeName ?? '—'}</span>
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (wo) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusPill size="sm" fsm="maintenanceMunkalap" status={wo.status} label={WO_STATUS_LABELS[wo.status]} />
          {wo.requiresDowntime && (
            <span aria-label="Leállással jár" title="Leállással jár"
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
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Munkalapok</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Bejelentve → ütemezve → folyamatban → kész (+halasztva/elutasítva, újranyitással)
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
              {s === 'all' ? 'Mind' : s === 'open' ? 'Nyitott' : WO_STATUS_LABELS[s as WorkOrderStatus]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(workOrders.data ?? []).length} munkalap
        </div>
      </div>

      <QueryGate isPending={workOrders.isPending} isError={workOrders.isError}
        onRetry={() => void workOrders.refetch()} resource="munkalapok">
        <DataTable
          columns={columns}
          rows={workOrders.data ?? []}
          rowKey={(wo) => wo.id}
          caption="Munkalapok típussal, prioritással és FSM-státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő munkalap."
        />
      </QueryGate>

      <WorkOrderDetailSlideOver workOrderId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

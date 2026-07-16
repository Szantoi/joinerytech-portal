import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../../components/ui'
import { useOpps, weightedValue, type Opportunity, type OppStatus } from '../services'
import { OPP_STATUS_LABELS, formatDate, formatMoney } from './labels'
import { OppDetailSlideOver } from './OppDetailSlideOver'

/**
 * Lehetőségek — DataTable (kettős render) súlyozott értékkel, nyitott/mind/
 * státusz szűrővel; detail SlideOver (FSM stepper + átmenetek + ajánlat-csonk).
 */

const FILTERS = ['open', 'all', 'ajanlat', 'targyalas', 'megnyert', 'elveszett'] as const
type Filter = (typeof FILTERS)[number]

export function OppsScreen() {
  const [filter, setFilter] = useState<Filter>('open')
  const opps = useOpps(
    filter === 'open' ? { open: true } : filter === 'all' ? {} : { status: filter as OppStatus },
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const totalValue = (opps.data ?? []).reduce((s, o) => s + o.value, 0)

  const columns: DataTableColumn<Opportunity>[] = [
    {
      key: 'title', header: 'Lehetőség', sortable: true, mobile: 'title',
      sortValue: (o) => o.title,
      render: (o) => (
        <button
          onClick={() => setSelectedId(o.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[220px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {o.title}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">{o.id}</span>
        </button>
      ),
    },
    { key: 'customer', header: 'Ügyfél', sortable: true, sortValue: (o) => o.customer, render: (o) => o.customer },
    {
      key: 'status', header: 'Fázis',
      render: (o) => (
        <StatusPill size="sm" fsm="crmOpportunity" status={o.status} label={OPP_STATUS_LABELS[o.status]} />
      ),
    },
    {
      key: 'value', header: 'Érték', sortable: true,
      sortValue: (o) => o.value,
      render: (o) => <span className="font-semibold tabular-nums">{formatMoney(o.value)}</span>,
    },
    {
      key: 'weighted', header: 'Súlyozott', mobile: 'hidden',
      render: (o) => <span className="tabular-nums text-ink-muted">{formatMoney(weightedValue(o.value, o.status))}</span>,
    },
    {
      key: 'expectedClose', header: 'Várható zárás', sortable: true, mobile: 'hidden',
      sortValue: (o) => o.expectedClose,
      render: (o) => <span className="font-mono text-[11.5px]">{formatDate(o.expectedClose)}</span>,
    },
    { key: 'owner', header: 'Felelős', mobile: 'meta', render: (o) => o.owner },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Lehetőségek</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          FSM: nyitott → igényfelmérés → összeállítás → ajánlat → tárgyalás → megnyert | elveszett
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Fázis-szűrő">
          {FILTERS.map((s) => (
            // Aktív jelzés nem csak színnel (spec §3.3 chip-sor: pipa-ikon + vastagabb
            // súly); a 28 px-es pill körül before-pszeudóval 44 px-es touch-célfelület.
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
              {s === 'open' ? 'Nyitott' : s === 'all' ? 'Mind' : OPP_STATUS_LABELS[s as OppStatus]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(opps.data ?? []).length} db · <span className="font-semibold tabular-nums">{formatMoney(totalValue)}</span>
        </div>
      </div>

      <QueryGate isPending={opps.isPending} isError={opps.isError}
        onRetry={() => void opps.refetch()} resource="lehetőségek">
        <DataTable
          columns={columns}
          rows={opps.data ?? []}
          rowKey={(o) => o.id}
          caption="Lehetőségek listája fázissal, értékkel és súlyozott értékkel"
          emptyMessage="Nincs a szűrésnek megfelelő lehetőség."
        />
      </QueryGate>

      <OppDetailSlideOver oppId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

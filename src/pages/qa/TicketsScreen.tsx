import { useState } from 'react'
import { DataTable, Icon, StatusPill, type DataTableColumn } from '../../components/ui'
import { useTickets, type TicketStatus } from '../../services/qa'
import type { Ticket } from '../../services/qa/tickets'
import { QueryGate } from '../ehs/QueryGate'
import {
  TICKET_PRIORITY_META, TICKET_STATUS_META, TICKET_TYPE_META, formatDate,
} from './labels'
import { TicketDetailSlideOver } from './TicketDetailSlideOver'

/**
 * Hibajegyek — DataTable (kettős render), státusz-szűrő chipekkel
 * (szerver-oldali; a „Nyitott" a nevesített TICKET_OPEN_STATUSES guard
 * szerver-oldali tükre: open=true); sor-cím kattintásra részlet-SlideOver a
 * hibajegy-FSM akciókkal (kiosztás/megkezdés/megoldás/elutasítás/újranyitás
 * + eszkaláció).
 */

const FILTERS = [
  'open', 'all', 'bejelentve', 'kiosztva', 'folyamatban', 'megoldva', 'elutasitva',
] as const
type Filter = (typeof FILTERS)[number]

function filterToQuery(filter: Filter) {
  if (filter === 'all') return {}
  if (filter === 'open') return { open: true }
  return { status: filter }
}

export function TicketsScreen() {
  const [filter, setFilter] = useState<Filter>('open')
  const tickets = useTickets(filterToQuery(filter))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: DataTableColumn<Ticket>[] = [
    {
      key: 'title', header: 'Hibajegy', sortable: true, mobile: 'title',
      sortValue: (t) => t.title,
      render: (t) => (
        <button
          onClick={() => setSelectedId(t.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[240px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {t.title}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">
            {t.id} · {t.productName ?? t.orderRef ?? '—'}
          </span>
        </button>
      ),
    },
    {
      key: 'type', header: 'Típus', mobile: 'meta',
      render: (t) => (
        <StatusPill size="sm" tone={TICKET_TYPE_META[t.ticketType].tone} label={TICKET_TYPE_META[t.ticketType].label} />
      ),
    },
    {
      key: 'priority', header: 'Súlyosság', mobile: 'meta',
      render: (t) => (
        <StatusPill size="sm" tone={TICKET_PRIORITY_META[t.priority].tone} label={TICKET_PRIORITY_META[t.priority].label} />
      ),
    },
    {
      key: 'inspection', header: 'Átvizsgálás', mobile: 'hidden',
      render: (t) => (
        <span className="text-[11.5px] text-ink-muted">
          {t.inspectionId ? `${t.inspectionId}` : '—'}
        </span>
      ),
    },
    {
      key: 'reportedAt', header: 'Bejelentve', sortable: true, mobile: 'hidden',
      sortValue: (t) => t.reportedAt,
      render: (t) => <span className="text-[11.5px] text-ink-muted">{formatDate(t.reportedAt)}</span>,
    },
    {
      key: 'assignee', header: 'Felelős', mobile: 'hidden',
      render: (t) => (
        <span className="text-[11.5px] text-ink-muted">{t.assigneeName ?? '—'}</span>
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (t) => (
        <StatusPill size="sm" tone={TICKET_STATUS_META[t.status].tone} label={TICKET_STATUS_META[t.status].label} />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Hibajegyek</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Bejelentve → kiosztva → folyamatban → megoldva (+elutasítva, újranyitással)
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
              {s === 'all' ? 'Mind' : s === 'open' ? 'Nyitott' : TICKET_STATUS_META[s as TicketStatus].label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(tickets.data ?? []).length} hibajegy
        </div>
      </div>

      <QueryGate isPending={tickets.isPending} isError={tickets.isError}
        onRetry={() => void tickets.refetch()} resource="hibajegyek">
        <DataTable
          columns={columns}
          rows={tickets.data ?? []}
          rowKey={(t) => t.id}
          caption="Hibajegyek típussal, súlyossággal és FSM-státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő hibajegy."
        />
      </QueryGate>

      <TicketDetailSlideOver ticketId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

import { useState } from 'react'
import { DataTable, Icon, StatusPill, type DataTableColumn } from '../../components/ui'
import { useLeads, type Lead, type LeadStatus } from '../../services/crm'
import { QueryGate } from '../ehs/QueryGate'
import { LEAD_STATUS_LABELS, SOURCE_LABELS, formatDate, formatMoney } from './labels'
import { LeadDetailSlideOver } from './LeadDetailSlideOver'

/**
 * Leadek — DataTable (≥md tábla, <md kártya kettős render), státusz-chip
 * szűrő + kereső (szerver-oldali szűrés az MSW kontraktuson), detail
 * SlideOver FSM-akciókkal és naplóval.
 */

const FILTERS = ['all', 'uj', 'kapcsolat', 'minosites', 'nurturing', 'konvertalva', 'elvetve'] as const

export function LeadsScreen() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const leads = useLeads({
    status: statusFilter === 'all' ? undefined : statusFilter,
    q: q || undefined,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: DataTableColumn<Lead>[] = [
    {
      key: 'contact', header: 'Kontakt', sortable: true, mobile: 'title',
      sortValue: (l) => l.contact,
      render: (l) => (
        <button
          onClick={() => setSelectedId(l.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {l.contact}
          </span>
          <span className="block text-[10.5px] text-ink-muted">{l.company || l.city}</span>
        </button>
      ),
    },
    { key: 'title', header: 'Igény', render: (l) => <span className="text-[12px]">{l.title}</span> },
    {
      key: 'source', header: 'Forrás', mobile: 'hidden',
      render: (l) => <StatusPill size="sm" tone="info" label={SOURCE_LABELS[l.source]} />,
    },
    {
      key: 'status', header: 'Státusz',
      render: (l) => (
        <StatusPill size="sm" fsm="crmLead" status={l.status} label={LEAD_STATUS_LABELS[l.status]} />
      ),
    },
    {
      key: 'estValue', header: 'Becsült érték', sortable: true,
      sortValue: (l) => l.estValue,
      render: (l) => <span className="font-semibold tabular-nums">{formatMoney(l.estValue)}</span>,
    },
    {
      key: 'createdAt', header: 'Létrehozva', sortable: true, mobile: 'hidden',
      sortValue: (l) => l.createdAt,
      render: (l) => <span className="font-mono text-[11.5px]">{formatDate(l.createdAt)}</span>,
    },
    { key: 'owner', header: 'Felelős', mobile: 'meta', render: (l) => l.owner },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Leadek</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          FSM: új → kapcsolatfelvétel → minősítés → nurturing → konvertálva (+elvetve)
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {FILTERS.map((s) => (
            // Aktív jelzés nem csak színnel (spec §3.3 chip-sor: pipa-ikon + vastagabb
            // súly); a 28 px-es pill körül before-pszeudóval 44 px-es touch-célfelület.
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                statusFilter === s
                  ? 'bg-world font-semibold text-world-fg'
                  : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {statusFilter === s && (
                <span aria-hidden="true" className="inline-flex">
                  <Icon name="check" size={12} />
                </span>
              )}
              {s === 'all' ? 'Mind' : LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés…"
            aria-label="Keresés a leadek között"
            className="h-8 w-44 rounded-lg border border-line bg-surface-1 pl-8 pr-3 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      <QueryGate isPending={leads.isPending} isError={leads.isError}
        onRetry={() => void leads.refetch()} resource="leadek">
        <DataTable
          columns={columns}
          rows={leads.data ?? []}
          rowKey={(l) => l.id}
          caption="Leadek listája státusszal és becsült értékkel"
          emptyMessage="Nincs a szűrésnek megfelelő lead."
        />
      </QueryGate>

      <LeadDetailSlideOver leadId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

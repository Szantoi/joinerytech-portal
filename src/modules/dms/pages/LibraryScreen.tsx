import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../../components/ui'
import {
  useDocuments,
  type DocLinkType, type DocType, type DocumentStatus,
} from '../services'
import type { DmsDocument, DocumentFilters } from '../services/documents'
import {
  DOCUMENT_STATUS_LABELS, DOC_LINK_LABELS, DOC_LINK_ORDER, DOC_TYPE_META,
  DOC_TYPE_ORDER, EXPIRY_META, formatDate,
} from './labels'
import { DocumentDetailSlideOver } from './DocumentDetailSlideOver'

/**
 * Könyvtár — DataTable (kettős render), SZERVER-oldali szűrés: kereső (q),
 * státusz- és típus-mappa chipek (S2-minta: pipa + font-semibold + 44 px
 * touch-cél), kapcsolat-mappa választó (a prototípus DOC_LINK_META tengelye).
 * Sor-cím kattintásra részlet-SlideOver a verziótörténettel és a
 * jóváhagyás-folyam FSM-gombjaival. Az „Érvényes verzió" oszlop a SZÁMÍTOTT
 * releasedVersion mezőt jeleníti meg (runtimeVersion-tükör).
 */

const STATUS_FILTERS = ['all', 'piszkozat', 'ellenorzes', 'kiadott', 'archivalt'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

type TypeFilter = DocType | 'all'
type LinkFilter = DocLinkType | 'all'

/** Aktív chip-stílus (S2-minta) — közös a két chip-sorhoz. */
function chipCls(active: boolean): string {
  return `relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
    active
      ? 'bg-world font-semibold text-world-fg'
      : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
  }`
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={chipCls(active)}>
      {active && (
        <span aria-hidden="true" className="inline-flex">
          <Icon name="check" size={12} />
        </span>
      )}
      {label}
    </button>
  )
}

export function LibraryScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters: DocumentFilters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    linkType: linkFilter === 'all' ? undefined : linkFilter,
    q: search.trim() || undefined,
  }
  const documents = useDocuments(filters)

  const columns: DataTableColumn<DmsDocument>[] = [
    {
      key: 'name', header: 'Dokumentum', sortable: true, mobile: 'title',
      sortValue: (d) => d.name,
      render: (d) => (
        <button
          onClick={() => setSelectedId(d.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[260px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {d.name}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">
            {d.id} · {DOC_LINK_LABELS[d.linkType]}: {d.linkLabel}
          </span>
        </button>
      ),
    },
    {
      key: 'type', header: 'Típus', mobile: 'meta',
      render: (d) => (
        <StatusPill size="sm" tone={DOC_TYPE_META[d.type].tone} label={DOC_TYPE_META[d.type].label} />
      ),
    },
    {
      key: 'version', header: 'Verzió', mobile: 'meta',
      render: (d) => (
        <span className="text-[11.5px] text-ink">
          <span className="font-mono font-semibold">v{d.version}</span>
          {/* runtimeVersion-tükör: ha az aktuális nem kiadott, a műhely a korábbit használja */}
          {d.status !== 'kiadott' && (
            <span className="block text-[10.5px] text-ink-muted">
              {d.releasedVersion !== null ? `érvényes: v${d.releasedVersion}` : 'nincs kiadott'}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'owner', header: 'Felelős', mobile: 'hidden',
      render: (d) => <span className="text-[11.5px] text-ink-muted">{d.owner}</span>,
    },
    {
      key: 'updatedAt', header: 'Frissítve', sortable: true, mobile: 'hidden',
      sortValue: (d) => d.updatedAt,
      render: (d) => (
        <span className="font-mono text-[11.5px] text-ink">{formatDate(d.updatedAt)}</span>
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (d) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <StatusPill size="sm" fsm="dmsDokumentum" status={d.status} label={DOCUMENT_STATUS_LABELS[d.status]} />
          {d.expiry && (
            <StatusPill size="sm" tone={EXPIRY_META[d.expiry].tone} label={EXPIRY_META[d.expiry].label} />
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Könyvtár</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Verziózott dokumentumok — piszkozat → ellenőrzés → kiadott (+archivált); a műhely a kiadott verziót használja
        </p>
      </div>

      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="dms-search">Keresés</label>
          <input
            id="dms-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés (név / azonosító / kapcsolat / fájl)…"
            className="h-8 w-64 max-w-full rounded-lg border border-line bg-surface-1 px-2.5 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
          <label className="sr-only" htmlFor="dms-link-filter">Kapcsolat-mappa</label>
          <select
            id="dms-link-filter"
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value as LinkFilter)}
            className="h-8 rounded-lg border border-line bg-surface-1 px-2 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <option value="all">Minden mappa</option>
            {DOC_LINK_ORDER.map((link) => (
              <option key={link} value={link}>{DOC_LINK_LABELS[link]}</option>
            ))}
          </select>
          <div className="ml-auto text-[11px] text-ink-muted">
            {(documents.data ?? []).length} dokumentum
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {STATUS_FILTERS.map((s) => (
            <Chip key={s} active={statusFilter === s}
              label={s === 'all' ? 'Mind' : DOCUMENT_STATUS_LABELS[s as DocumentStatus]}
              onClick={() => setStatusFilter(s)} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Típus-mappák">
          <Chip active={typeFilter === 'all'} label="Minden típus" onClick={() => setTypeFilter('all')} />
          {DOC_TYPE_ORDER.map((t) => (
            <Chip key={t} active={typeFilter === t} label={DOC_TYPE_META[t].label}
              onClick={() => setTypeFilter(t)} />
          ))}
        </div>
      </div>

      <QueryGate isPending={documents.isPending} isError={documents.isError}
        onRetry={() => void documents.refetch()} resource="dokumentumok">
        <DataTable
          columns={columns}
          rows={documents.data ?? []}
          rowKey={(d) => d.id}
          caption="Dokumentumok típussal, verzióval, felelőssel és FSM-státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő dokumentum."
        />
      </QueryGate>

      <DocumentDetailSlideOver documentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

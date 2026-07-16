import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../components/ui'
import { useAssets, type Asset, type AssetKind } from '../../services/maintenance'
import {
  ASSET_KIND_META, ASSET_KIND_ORDER, ASSET_STATUS_META, formatOperatingHours,
} from './labels'
import { AssetDetailSlideOver } from './AssetDetailSlideOver'
import { WorkOrderDetailSlideOver } from './WorkOrderDetailSlideOver'

/**
 * Eszköz-nyilvántartás — eszközök DataTable-ben (kettős render), kategória-
 * szűrő chipekkel (szerver-oldali) + kereső (q); sor-cím kattintásra
 * részlet-SlideOver (tervek + munkalap-előzmény, onnan munkalap-detail).
 * Az eszköz-státusz SZÁMÍTOTT — a válasz `status` mezője jelenik meg.
 */

const FILTERS = ['all', ...ASSET_KIND_ORDER] as const
type Filter = (typeof FILTERS)[number]

export function AssetsScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const assets = useAssets({
    ...(filter === 'all' ? {} : { kind: filter }),
    ...(q.trim() === '' ? {} : { q: q.trim() }),
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null)

  const columns: DataTableColumn<Asset>[] = [
    {
      key: 'name', header: 'Eszköz', sortable: true, mobile: 'title',
      sortValue: (a) => a.code,
      render: (a) => (
        <button
          onClick={() => setSelectedId(a.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[220px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {a.name}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">{a.code}</span>
        </button>
      ),
    },
    {
      key: 'kind', header: 'Kategória', mobile: 'meta',
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink">
          <span aria-hidden="true" className="text-ink-muted">
            <Icon name={ASSET_KIND_META[a.kind].icon} size={13} />
          </span>
          {ASSET_KIND_META[a.kind].label}
        </span>
      ),
    },
    {
      key: 'location', header: 'Hely', mobile: 'hidden',
      render: (a) => <span className="text-[11.5px] text-ink-muted">{a.location}</span>,
    },
    {
      key: 'operatingHours', header: 'Üzemóra', sortable: true, mobile: 'hidden',
      sortValue: (a) => a.operatingHours,
      render: (a) => (
        <span className="font-mono text-[11.5px] tabular-nums text-ink">
          {formatOperatingHours(a.operatingHours)}
        </span>
      ),
    },
    {
      key: 'open', header: 'Nyitott / esedékes', sortable: true, mobile: 'meta',
      sortValue: (a) => a.openWorkOrders + a.duePlans,
      render: (a) => (
        <span className="text-[11.5px] tabular-nums text-ink">
          {a.openWorkOrders} munkalap
          {a.duePlans > 0 && (
            <span className="ml-1.5 font-medium text-amber-700 dark:text-amber-400">
              · {a.duePlans} esedékes terv
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (a) => (
        <StatusPill size="sm" tone={ASSET_STATUS_META[a.status].tone} label={ASSET_STATUS_META[a.status].label} />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Eszközök</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Eszköz-nyilvántartás számított üzemállapottal (a munkalapokból derivált)
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 md:max-w-[280px]">
          <span aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <Icon name="search" size={14} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Keresés név, kód vagy gyártó szerint"
            placeholder="Keresés név / kód / gyártó…"
            className="h-8 w-full rounded-lg border border-line bg-surface-1 pl-8 pr-3 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Kategória-szűrő">
          {FILTERS.map((k) => (
            // Aktív jelzés nem csak színnel (pipa + font-semibold) + 44 px-es
            // touch-célfelület before-pszeudóval — a Kontrolling S2-fix mintája.
            <button
              key={k}
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                filter === k
                  ? 'bg-world font-semibold text-world-fg'
                  : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {filter === k && (
                <span aria-hidden="true" className="inline-flex">
                  <Icon name="check" size={12} />
                </span>
              )}
              {k === 'all' ? 'Mind' : ASSET_KIND_META[k as AssetKind].label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(assets.data ?? []).length} eszköz
        </div>
      </div>

      <QueryGate isPending={assets.isPending} isError={assets.isError}
        onRetry={() => void assets.refetch()} resource="eszközök">
        <DataTable
          columns={columns}
          rows={assets.data ?? []}
          rowKey={(a) => a.id}
          caption="Eszközök kategóriával, üzemórával és számított státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő eszköz."
        />
      </QueryGate>

      <AssetDetailSlideOver
        assetId={selectedId}
        onClose={() => setSelectedId(null)}
        onOpenWorkOrder={(id) => { setSelectedId(null); setSelectedWoId(id) }}
      />
      <WorkOrderDetailSlideOver workOrderId={selectedWoId} onClose={() => setSelectedWoId(null)} />
    </div>
  )
}

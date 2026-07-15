import { useState } from 'react'
import { DataTable, StatusPill, type DataTableColumn } from '../../components/ui'
import {
  useHazardousMaterials, useEhsLocations, locationNameMap,
  type HazardousMaterialListItem,
} from '../../services/ehs'
import { MATERIAL_STATUS_LABELS, SDS_VALIDITY_META, formatDate } from './labels'
import { QueryGate } from './QueryGate'
import { SdsDetailSlideOver } from './SdsDetailSlideOver'

/**
 * SDS / Veszélyes anyagok képernyő — DataTable (≥md tábla, <md kártya) az
 * SDS érvényesség SZÁMÍTOTT StatusPill-jével (Valid=success / Expiring=warn /
 * Expired=danger), detail SlideOver + SDS-megújítás akcióval.
 */
export function SdsScreen() {
  const materials = useHazardousMaterials()
  const locations = useEhsLocations()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const locNames = locationNameMap(locations.data)

  const columns: DataTableColumn<HazardousMaterialListItem>[] = [
    {
      key: 'name', header: 'Anyag', sortable: true, mobile: 'title',
      sortValue: (m) => m.name,
      render: (m) => (
        <button
          onClick={() => setSelectedId(m.materialId)}
          className="rounded text-left text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          {m.name}
        </button>
      ),
    },
    { key: 'supplier', header: 'Szállító', render: (m) => m.supplier },
    {
      key: 'location', header: 'Tárolási hely',
      render: (m) => locNames.get(m.storageLocationId) ?? '—',
    },
    {
      key: 'quantity', header: 'Mennyiség', mobile: 'hidden',
      render: (m) => (m.quantityOnSite !== undefined ? `${m.quantityOnSite} ${m.unit ?? ''}` : '—'),
    },
    {
      key: 'expiry', header: 'SDS lejárat', sortable: true,
      sortValue: (m) => m.sdsExpiresAt,
      render: (m) => <span className="font-mono text-[12px]">{formatDate(m.sdsExpiresAt)}</span>,
    },
    {
      key: 'validity', header: 'SDS érvényesség',
      render: (m) => (
        <StatusPill tone={SDS_VALIDITY_META[m.sdsValidity].tone} label={SDS_VALIDITY_META[m.sdsValidity].label} />
      ),
    },
    {
      key: 'status', header: 'Státusz', mobile: 'hidden',
      render: (m) => (
        <StatusPill tone={m.status === 'Active' ? 'progress' : 'terminal'} label={MATERIAL_STATUS_LABELS[m.status]} />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Veszélyes anyagok</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          SDS-nyilvántartás — az érvényesség a lejárati dátumból számított (30 napos figyelmeztetési ablak)
        </p>
      </div>

      <QueryGate isPending={materials.isPending} isError={materials.isError}
        onRetry={() => void materials.refetch()} resource="veszélyesanyag-törzs">
        <DataTable
          columns={columns}
          rows={materials.data ?? []}
          rowKey={(m) => m.materialId}
          caption="Veszélyes anyagok és SDS érvényességük"
          emptyMessage="Nincs nyilvántartott veszélyes anyag."
        />
      </QueryGate>

      <SdsDetailSlideOver materialId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

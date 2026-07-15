import { useState } from 'react'
import { DataTable, StatusPill, type DataTableColumn } from '../../components/ui'
import {
  EXPIRY_WARN_DAYS, daysUntilExpiry, todayIso, useDocuments,
} from '../../services/dms'
import type { DmsDocument } from '../../services/dms/documents'
import { QueryGate } from '../ehs/QueryGate'
import {
  DOCUMENT_STATUS_LABELS, DOC_TYPE_META, EXPIRY_META, EXPIRY_WINDOW_LABEL,
  formatDate, formatExpiryDays,
} from './labels'
import { DocumentDetailSlideOver } from './DocumentDetailSlideOver'

/**
 * Lejáró / felülvizsgálandó dokumentumok — a szerver-oldali `expiring=true`
 * szűrő (a backend GET /search/expiring|expired előképe): lejárt vagy a
 * config-ablakon (EXPIRY_WARN_DAYS) belül lejáró, NEM archivált dokumentumok,
 * legkorábbi érvényesség elöl. A küszöb SOHA nem literál a UI-ban
 * (HR-review M1-lecke) — az alcím és a jelmagyarázat a configból számított.
 */
export function ExpiringScreen() {
  const documents = useDocuments({ expiring: true })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const today = todayIso()

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
            {d.id} · {d.linkLabel}
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
      key: 'owner', header: 'Felelős', mobile: 'hidden',
      render: (d) => <span className="text-[11.5px] text-ink-muted">{d.owner}</span>,
    },
    {
      key: 'validUntil', header: 'Érvényes eddig', sortable: true, mobile: 'meta',
      sortValue: (d) => d.validUntil ?? '',
      render: (d) => (
        <span className="text-[11.5px] text-ink">
          <span className="font-mono">{formatDate(d.validUntil)}</span>
          <span className="block text-[10.5px] text-ink-muted">
            {formatExpiryDays(daysUntilExpiry(d.validUntil, today))}
          </span>
        </span>
      ),
    },
    {
      key: 'expiry', header: 'Lejárat', mobile: 'meta',
      render: (d) =>
        d.expiry ? (
          <StatusPill size="sm" tone={EXPIRY_META[d.expiry].tone} label={EXPIRY_META[d.expiry].label} />
        ) : null,
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (d) => (
        <StatusPill size="sm" fsm="dmsDokumentum" status={d.status} label={DOCUMENT_STATUS_LABELS[d.status]} />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">
          Lejáró / felülvizsgálat
        </h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          {/* a küszöb a configból (EXPIRY_WARN_DAYS) — sosem literál */}
          Lejárt és a következő {EXPIRY_WARN_DAYS} napban lejáró dokumentumok (archivált nélkül) — tanúsítványok, szerződések felülvizsgálata
        </p>
      </div>

      <div className="mb-3 text-[11px] text-ink-muted">
        {(documents.data ?? []).length} felülvizsgálandó · {EXPIRY_WINDOW_LABEL}
      </div>

      <QueryGate isPending={documents.isPending} isError={documents.isError}
        onRetry={() => void documents.refetch()} resource="lejáró dokumentumok">
        <DataTable
          columns={columns}
          rows={documents.data ?? []}
          rowKey={(d) => d.id}
          caption="Lejárt és hamarosan lejáró dokumentumok érvényességi dátummal"
          emptyMessage="Nincs lejáró vagy lejárt dokumentum — minden érvényes."
        />
      </QueryGate>

      <DocumentDetailSlideOver documentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

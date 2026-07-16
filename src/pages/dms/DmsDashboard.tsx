import { useState } from 'react'
import { Card, QueryGate, StatusPill } from '../../components/ui'
import {
  EXPIRY_WARN_DAYS, RECENT_DOCS_LIMIT, daysUntilExpiry, docStats,
  isDocumentInReview, todayIso, useDocuments,
} from '../../services/dms'
import type { DmsDocument } from '../../services/dms/documents'
import {
  DOCUMENT_STATUS_LABELS, DOC_TYPE_META, EXPIRY_META,
  formatDate, formatExpiryDays,
} from './labels'
import { DocumentDetailSlideOver } from './DocumentDetailSlideOver'

/**
 * DMS áttekintés — KPI-k a query hookokból (összes dokumentum, kiadott,
 * ellenőrzésre vár, lejáró/lejárt a config-küszöbbel) + státusz-eloszlás
 * (szín+szöveg, sr-only összefoglalóval), ellenőrzésre váró és lejáró
 * dokumentumok listái, legutóbbi dokumentumok. Minden érték az API-ból
 * származó sorokból a calc-tükörrel számított (az `expiry`/`releasedVersion`
 * a válaszból jön — sosem kliens-számítás), nincs statikus adat.
 */
export function DmsDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const documents = useDocuments()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = documents.data ?? []
  const stats = docStats(rows)

  const inReview = rows.filter((d) => isDocumentInReview(d.status))
  // a lejárat-állapot a SZÁMÍTOTT expiry mezőből (archivált nem akció-tétel)
  const expiring = rows.filter((d) => d.expiry !== null && d.status !== 'archivalt')
  const expiredCount = expiring.filter((d) => d.expiry === 'lejart').length

  const recentDocs = [...rows]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_DOCS_LIMIT)

  /** Státusz-eloszlás (szín + szöveg, nem csak szín) — DocsEngine.stats tükör. */
  const distribution = (['piszkozat', 'ellenorzes', 'kiadott', 'archivalt'] as const).map(
    (status) => ({ status, count: stats[status] }),
  )
  const maxCount = Math.max(1, ...distribution.map((d) => d.count))

  const today = todayIso()

  const kpis = [
    {
      label: 'Összes dokumentum',
      value: String(stats.total),
      sub: `${stats.archivalt} archivált`,
    },
    {
      label: 'Kiadott',
      value: String(stats.kiadott),
      sub: 'a műhely ezeket használja',
    },
    {
      label: 'Ellenőrzésre vár',
      value: String(stats.ellenorzes),
      sub: stats.piszkozat > 0 ? `+${stats.piszkozat} piszkozat` : 'nincs piszkozat',
      alert: stats.ellenorzes > 0,
    },
    {
      label: 'Lejáró / lejárt',
      value: String(expiring.length),
      // a küszöb a configból (M1-lecke) — sosem literál
      sub: expiredCount > 0 ? `${expiredCount} már lejárt` : `${EXPIRY_WARN_DAYS} napos ablak`,
      alert: expiring.length > 0,
    },
  ]

  const docRow = (d: DmsDocument, meta: string) => (
    <li key={d.id} className="flex items-center gap-3">
      <button
        onClick={() => setSelectedId(d.id)}
        className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
      >
        <div className="truncate text-[12px] font-medium text-ink underline-offset-2 hover:underline">
          {d.name}
        </div>
        <div className="truncate text-[10.5px] text-ink-muted">{meta}</div>
      </button>
      <span className="hidden sm:inline-flex">
        <StatusPill size="sm" tone={DOC_TYPE_META[d.type].tone} label={DOC_TYPE_META[d.type].label} />
      </span>
      <StatusPill size="sm" fsm="dmsDokumentum" status={d.status} label={DOCUMENT_STATUS_LABELS[d.status]} />
    </li>
  )

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Verziózott dokumentumok, jóváhagyás-folyam és lejárat-figyelés
        </p>
      </div>

      <QueryGate
        isPending={documents.isPending}
        isError={documents.isError}
        resource="dokumentumtár áttekintés"
        onRetry={() => void documents.refetch()}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{k.label}</div>
              <div className={`mt-1 text-[26px] font-semibold tabular-nums tracking-tight ${k.alert ? 'text-rose-600 dark:text-rose-400' : 'text-ink'}`}>
                {k.value}
              </div>
              <div className="mt-1 text-[10.5px] text-ink-muted">{k.sub}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Státusz-eloszlás (DocsEngine.stats tükör) */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Státusz-eloszlás</h2>
              <button
                onClick={() => onScreen('library')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Könyvtár →
              </button>
            </div>
            <p className="sr-only">
              Dokumentumok státusz szerint:{' '}
              {distribution
                .map((d) => `${DOCUMENT_STATUS_LABELS[d.status]}: ${d.count} db`)
                .join(', ')}.
            </p>
            <ul aria-hidden="true" className="space-y-2.5">
              {distribution.map((d) => (
                <li key={d.status} className="flex items-center gap-3">
                  <span className="w-24 shrink-0">
                    <StatusPill size="sm" fsm="dmsDokumentum" status={d.status} label={DOCUMENT_STATUS_LABELS[d.status]} />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-world"
                      style={{ width: `${(d.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-ink">
                    {d.count} db
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Ellenőrzésre váró dokumentumok (jóváhagyás-folyam) */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">
                Ellenőrzésre vár{inReview.length ? ` (${inReview.length})` : ''}
              </h2>
              <button
                onClick={() => onScreen('library')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Könyvtár →
              </button>
            </div>
            {inReview.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs ellenőrzésre váró dokumentum.</p>
            ) : (
              <ul className="space-y-2.5">
                {inReview.map((d) =>
                  docRow(d, `${d.id} · v${d.version} · ${d.owner} · ${formatDate(d.updatedAt)}`))}
              </ul>
            )}
          </Card>
        </div>

        {/* Lejáró / lejárt dokumentumok (config-ablak) */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-ink">
              Lejáró / lejárt dokumentumok{expiring.length ? ` (${expiring.length})` : ''}
            </h2>
            <button
              onClick={() => onScreen('expiring')}
              className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              Felülvizsgálat →
            </button>
          </div>
          {expiring.length === 0 ? (
            <p className="px-4 py-6 text-[12px] text-ink-muted">Nincs lejáró dokumentum az ablakban.</p>
          ) : (
            <ul>
              {expiring.map((d) => (
                <li key={d.id} className="border-b border-line last:border-0">
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-ink">{d.name}</div>
                      <div className="font-mono text-[10.5px] text-ink-muted">
                        {d.id} · érvényes: {formatDate(d.validUntil)} ·{' '}
                        {formatExpiryDays(daysUntilExpiry(d.validUntil, today))}
                      </div>
                    </div>
                    {d.expiry && (
                      <StatusPill size="sm" tone={EXPIRY_META[d.expiry].tone} label={EXPIRY_META[d.expiry].label} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Legutóbbi dokumentumok */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Legutóbbi dokumentumok</h2>
            <button
              onClick={() => onScreen('library')}
              className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              Könyvtár →
            </button>
          </div>
          <ul className="space-y-2.5">
            {recentDocs.map((d) =>
              docRow(d, `${d.id} · v${d.version} · ${d.owner} · ${formatDate(d.updatedAt)}`))}
          </ul>
        </Card>
      </QueryGate>

      <DocumentDetailSlideOver documentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

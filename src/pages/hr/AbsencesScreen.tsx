import { useState } from 'react'
import { DataTable, Icon, StatusPill, type DataTableColumn } from '../../components/ui'
import { useAbsences, type Absence, type AbsenceStatus } from '../../services/hr'
import { QueryGate } from '../ehs/QueryGate'
import { ABSENCE_STATUS_LABELS, ABSENCE_TYPE_META, formatDate } from './labels'
import { AbsenceDetailSlideOver } from './AbsenceDetailSlideOver'

/**
 * Távollét-kezelés — kérelmek DataTable-ben (kettős render), státusz-szűrő
 * chipekkel (szerver-oldali); sor-cím kattintásra részlet-SlideOver a
 * távollét-FSM akciókkal (jóváhagyás/elutasítás/megkezdés/lezárás/újranyitás).
 */

const FILTERS = ['all', 'kert', 'jovahagyva', 'folyamatban', 'lezarva', 'elutasitva'] as const
type Filter = (typeof FILTERS)[number]

export function AbsencesScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const absences = useAbsences(filter === 'all' ? {} : { status: filter })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: DataTableColumn<Absence>[] = [
    {
      key: 'empName', header: 'Dolgozó', sortable: true, mobile: 'title',
      sortValue: (a) => a.empName,
      render: (a) => (
        <button
          onClick={() => setSelectedId(a.id)}
          className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <span className="block max-w-[200px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
            {a.empName}
          </span>
          <span className="block font-mono text-[10.5px] text-ink-muted">{a.id}</span>
        </button>
      ),
    },
    {
      key: 'type', header: 'Típus',
      render: (a) => (
        <StatusPill size="sm" tone={ABSENCE_TYPE_META[a.type].tone} label={ABSENCE_TYPE_META[a.type].label} />
      ),
    },
    {
      key: 'period', header: 'Időszak', sortable: true,
      sortValue: (a) => a.start,
      render: (a) => (
        <span className="font-mono text-[11.5px] text-ink">
          {formatDate(a.start)} – {formatDate(a.end)}
        </span>
      ),
    },
    {
      key: 'days', header: 'Munkanap', sortable: true, mobile: 'hidden',
      sortValue: (a) => a.days,
      render: (a) => <span className="tabular-nums">{a.days} nap</span>,
    },
    {
      key: 'requestedAt', header: 'Kérelmezve', sortable: true, mobile: 'hidden',
      sortValue: (a) => a.requestedAt,
      render: (a) => <span className="text-[11.5px] text-ink-muted">{formatDate(a.requestedAt)}</span>,
    },
    {
      key: 'status', header: 'Státusz', mobile: 'meta',
      render: (a) => (
        <StatusPill size="sm" fsm="hrTavollet" status={a.status} label={ABSENCE_STATUS_LABELS[a.status]} />
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Távollét</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Kérelmek és döntések — kért → jóváhagyva → folyamatban → lezárva (+elutasítva)
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
          {FILTERS.map((s) => (
            // Aktív jelzés nem csak színnel (pipa-ikon + font-semibold) + 44 px-es
            // touch-célfelület before-pszeudóval — a Kontrolling S2-fix mintája.
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
              {s === 'all' ? 'Mind' : ABSENCE_STATUS_LABELS[s as AbsenceStatus]}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-ink-muted">
          {(absences.data ?? []).length} kérelem
        </div>
      </div>

      <QueryGate isPending={absences.isPending} isError={absences.isError}
        onRetry={() => void absences.refetch()} resource="távollétek">
        <DataTable
          columns={columns}
          rows={absences.data ?? []}
          rowKey={(a) => a.id}
          caption="Távollét-kérelmek típussal, időszakkal és FSM-státusszal"
          emptyMessage="Nincs a szűrésnek megfelelő kérelem."
        />
      </QueryGate>

      <AbsenceDetailSlideOver absenceId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

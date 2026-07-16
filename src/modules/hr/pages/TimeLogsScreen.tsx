import { Button, DataTable, QueryGate, StatusPill, type DataTableColumn } from '../../../components/ui'
import {
  isTimeLogPushable, manageBlockReason, useHrPermissions, usePushTimeLogs,
  useTimeLogs, type TimeLog,
} from '../services'
import { formatDate, formatHours } from './labels'

/**
 * Munkaidő-napló — rögzített órák listája (DataTable, kettős render) és
 * Kontrolling-átadás. Az átadás STUB (services/hr/timeLogs.ts): a tételek
 * pushedAt-jelölést kapnak; a tiltott átadás (nincs átadható tétel / nincs
 * hr.manage jog) disabledReason-nel magyarázott, nem rejtett — az MSW 409
 * üzleti guardjának UI-tükre.
 */

export function TimeLogsScreen() {
  const timeLogs = useTimeLogs()
  const push = usePushTimeLogs()
  const { canManage } = useHrPermissions()

  const logs = timeLogs.data ?? []
  const pushable = logs.filter(isTimeLogPushable)

  const columns: DataTableColumn<TimeLog>[] = [
    {
      key: 'empName', header: 'Dolgozó', sortable: true, mobile: 'title',
      sortValue: (t) => t.empName,
      render: (t) => (
        <span className="block max-w-[200px]">
          <span className="block truncate text-[12.5px] font-semibold text-ink">{t.empName}</span>
          <span className="block font-mono text-[10.5px] text-ink-muted">{t.id}</span>
        </span>
      ),
    },
    {
      key: 'projectName', header: 'Projekt',
      render: (t) => (
        <span className="block max-w-[220px]">
          <span className="block truncate text-[12px] text-ink">{t.projectName}</span>
          {t.note && <span className="block truncate text-[10.5px] text-ink-muted">{t.note}</span>}
        </span>
      ),
    },
    {
      key: 'day', header: 'Nap', sortable: true,
      sortValue: (t) => t.day,
      render: (t) => <span className="font-mono text-[11.5px]">{formatDate(t.day)}</span>,
    },
    {
      key: 'hours', header: 'Órák', sortable: true,
      sortValue: (t) => t.hours,
      render: (t) => <span className="font-semibold tabular-nums">{formatHours(t.hours)}</span>,
    },
    {
      key: 'pushed', header: 'Kontrolling-átadás', mobile: 'meta',
      render: (t) =>
        t.pushedAt === null ? (
          <StatusPill size="sm" tone="warn" label="Átadásra vár" />
        ) : (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <StatusPill size="sm" tone="terminal" label="Átadva" />
            <span className="font-mono text-[10px] text-ink-muted">{t.pushedAt}</span>
          </span>
        ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Munkaidő-napló</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Rögzített munkaórák — átadás a Kontrolling tényköltség felé (stub-integráció)
          </p>
        </div>
        <Button
          icon="send"
          disabledReason={
            manageBlockReason(canManage) ??
            (push.isPending
              ? 'Folyamatban…'
              : pushable.length === 0
                ? 'Nincs átadható tétel.'
                : undefined)
          }
          onClick={() => push.mutate(undefined)}
        >
          Átadás a Kontrollingnak ({pushable.length})
        </Button>
      </div>

      <QueryGate isPending={timeLogs.isPending} isError={timeLogs.isError}
        onRetry={() => void timeLogs.refetch()} resource="munkaidő-napló">
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(t) => t.id}
          caption="Munkaóra-tételek dolgozóval, projekttel és átadási státusszal"
          emptyMessage="Nincs rögzített munkaóra-tétel."
        />
      </QueryGate>
    </div>
  )
}

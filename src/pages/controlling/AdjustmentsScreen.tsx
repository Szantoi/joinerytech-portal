import { useMemo, useState } from 'react'
import { Button, DataTable, StatusPill, type DataTableColumn } from '../../components/ui'
import { useAdjustments, useDeleteAdjustment, useProjects, type CostAdjustment } from '../../services/controlling'
import { QueryGate } from '../ehs/QueryGate'
import { AdjustmentForm } from './AdjustmentForm'
import { CATEGORY_LABELS, SCOPE_LABELS, formatDate, formatSignedHuf } from './labels'

/**
 * Törlés-gomb SAJÁT mutation-példánnyal (EHS PpeScreen / CRM TaskRow minta,
 * `src/pages/crm/TasksScreen.tsx:16-48`) — a „Törlés folyamatban…" pending-
 * állapot csak a kattintott sort tiltja, nem az egész listát.
 */
function AdjustmentDeleteButton({ adjustment }: { adjustment: CostAdjustment }) {
  const deleteAdjustment = useDeleteAdjustment()
  return (
    <Button
      variant="quiet" size="sm"
      onClick={() => deleteAdjustment.mutate(adjustment.id)}
      disabledReason={deleteAdjustment.isPending ? 'Törlés folyamatban…' : undefined}
      aria-label={`Korrekció törlése: ${adjustment.reason}`}
    >
      Törlés
    </Button>
  )
}

/**
 * Utókalkuláció — élő költség-korrekciók listája (DataTable, kettős render),
 * új tétel rögzítése (SlideOver form) és soft-delete. Minden mutáció a teljes
 * Kontrolling-cache-t invalidálja (a korrekció minden számított nézetet érint).
 */
export function AdjustmentsScreen() {
  const adjustments = useAdjustments()
  const projects = useProjects()
  const [formOpen, setFormOpen] = useState(false)

  const projectNames = useMemo(
    () => new Map((projects.data ?? []).map((p) => [p.id, p.name])),
    [projects.data],
  )

  const columns: DataTableColumn<CostAdjustment>[] = [
    {
      key: 'reason', header: 'Indok', mobile: 'title',
      render: (a) => (
        <span className="block max-w-[280px] text-[12.5px] font-medium text-ink">{a.reason}</span>
      ),
    },
    {
      key: 'target', header: 'Hatály / projekt',
      render: (a) => (
        <div className="flex flex-col gap-1">
          <StatusPill size="sm" tone={a.scope === 'portfolio' ? 'info' : 'neutral'} label={SCOPE_LABELS[a.scope]} />
          {a.projectId && (
            <span className="text-[10.5px] text-ink-muted">{projectNames.get(a.projectId) ?? a.projectId}</span>
          )}
        </div>
      ),
    },
    { key: 'category', header: 'Kategória', render: (a) => CATEGORY_LABELS[a.category] },
    {
      key: 'amount', header: 'Összeg', sortable: true,
      sortValue: (a) => a.amount,
      render: (a) => (
        <span className={`font-semibold tabular-nums ${a.amount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          {formatSignedHuf(a.amount)}
        </span>
      ),
    },
    {
      key: 'createdAt', header: 'Rögzítve', sortable: true, mobile: 'hidden',
      sortValue: (a) => a.createdAt,
      render: (a) => (
        <span className="text-[11.5px] text-ink-muted">{formatDate(a.createdAt)} · {a.createdBy}</span>
      ),
    },
    {
      key: 'actions', header: 'Művelet', mobile: 'meta',
      render: (a) => <AdjustmentDeleteButton adjustment={a} />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Utókalkuláció</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Kézi költség-korrekciók (audit trail) — a kategória tény-költségét módosítják
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} icon="plus">Új korrekció</Button>
      </div>

      <QueryGate isPending={adjustments.isPending} isError={adjustments.isError}
        onRetry={() => void adjustments.refetch()} resource="korrekciók">
        <DataTable
          columns={columns}
          rows={adjustments.data ?? []}
          rowKey={(a) => a.id}
          caption="Utókalkulációs korrekciók hatállyal, kategóriával és összeggel"
          emptyMessage="Még nincs rögzített korrekció."
          emptyAction={<Button size="sm" onClick={() => setFormOpen(true)}>Új korrekció</Button>}
        />
      </QueryGate>

      <AdjustmentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

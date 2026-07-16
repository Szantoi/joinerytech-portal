import { useState } from 'react'
import { Button, DataTable, QueryGate, StatusPill, type DataTableColumn } from '../../components/ui'
import { useCapas, useCompleteCapa, employeeName, type Capa } from '../../services/ehs'
import { CAPA_SOURCE_LABELS, formatDate, isOverdue } from './labels'
import { SelectField } from './formFields'

/**
 * Egységes CAPA-tábla — az esemény-kivizsgálásból, bejárás-megállapításból és
 * kockázatértékelésből származó intézkedések EGY listában (GET /corrective-actions).
 * Teljesítés: POST /{id}/complete; már kész intézkedésen az akció disabledReason-t kap.
 */
export function CapaBoard() {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
  const capas = useCapas(filter === 'all' ? {} : { completed: filter === 'done' })
  const complete = useCompleteCapa()

  const columns: DataTableColumn<Capa>[] = [
    {
      key: 'description', header: 'Intézkedés', mobile: 'title',
      render: (c) => <span className="text-[12.5px] font-medium text-ink">{c.description}</span>,
    },
    {
      key: 'source', header: 'Forrás',
      render: (c) => <StatusPill size="sm" tone="neutral" label={CAPA_SOURCE_LABELS[c.source]} />,
    },
    { key: 'assignedTo', header: 'Felelős', render: (c) => employeeName(c.assignedTo) },
    {
      key: 'dueDate', header: 'Határidő', sortable: true,
      sortValue: (c) => c.dueDate,
      render: (c) => (
        <span className={`font-mono text-[12px] ${!c.isCompleted && isOverdue(c.dueDate) ? 'font-semibold text-rose-700 dark:text-rose-300' : ''}`}>
          {formatDate(c.dueDate)}
          {!c.isCompleted && isOverdue(c.dueDate) && <span className="ml-1">(késésben)</span>}
        </span>
      ),
    },
    {
      key: 'status', header: 'Státusz',
      render: (c) => (
        <StatusPill tone={c.isCompleted ? 'success' : 'warn'} label={c.isCompleted ? 'Kész' : 'Nyitott'} />
      ),
    },
    {
      key: 'actions', header: 'Művelet',
      render: (c) => (
        <Button
          size="sm"
          variant="secondary"
          disabledReason={
            complete.isPending
              ? 'Folyamatban…'
              : c.isCompleted ? 'Az intézkedés már teljesítve van.' : undefined
          }
          onClick={() => complete.mutate(c.correctiveActionId)}
        >
          Teljesítés
        </Button>
      ),
    },
  ]

  return (
    <div>
      <SelectField label="Szűrés" value={filter}
        onChange={(e) => setFilter(e.target.value as typeof filter)} className="mb-3 max-w-[180px]">
        <option value="open">Nyitott</option>
        <option value="done">Kész</option>
        <option value="all">Mind</option>
      </SelectField>

      <QueryGate isPending={capas.isPending} isError={capas.isError}
        onRetry={() => void capas.refetch()} resource="CAPA-tábla">
        <DataTable
          columns={columns}
          rows={capas.data ?? []}
          rowKey={(c) => c.correctiveActionId}
          caption="Egységes CAPA-tábla (események + bejárások + kockázatok)"
          emptyMessage="Nincs intézkedés a kiválasztott szűréssel."
        />
      </QueryGate>
    </div>
  )
}

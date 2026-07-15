import { useState } from 'react'
import { Button, StatusPill } from '../../components/ui'
import { useTasks, useCompleteTask, computeTaskSla, type CrmTask } from '../../services/crm'
import { QueryGate } from '../ehs/QueryGate'
import { PRIORITY_META, SLA_META, formatDate } from './labels'

/**
 * Feladatok — SLA-jelvényes teendő-lista (SZÁMÍTOTT ok/soon/overdue tónusok)
 * + teljesítés akció. A lista határidő szerint rendezett (SLA-sértés elöl).
 */

/**
 * Egy feladat-sor SAJÁT mutation-példánnyal (EHS PpeScreen minta) — a
 * „Folyamatban…" pending-állapot csak a kattintott sort tiltja, nem az összeset.
 */
function TaskRow({ task }: { task: CrmTask }) {
  const complete = useCompleteTask()
  const sla = computeTaskSla(task.due)

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 ${task.done ? 'opacity-60' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink">{task.title}</div>
        <div className="mt-0.5 font-mono text-[10.5px] text-ink-muted">
          {task.refId} · {task.owner} · határidő: {formatDate(task.due)}
        </div>
      </div>
      <StatusPill size="sm" tone={PRIORITY_META[task.priority].tone} label={PRIORITY_META[task.priority].label} />
      {task.done ? (
        <StatusPill size="sm" tone="terminal" label="Teljesítve" />
      ) : (
        <>
          <StatusPill size="sm" tone={SLA_META[sla].tone} label={SLA_META[sla].label} />
          <Button
            size="sm"
            variant="secondary"
            disabledReason={complete.isPending ? 'Folyamatban…' : undefined}
            onClick={() => complete.mutate(task.id)}
          >
            Teljesítés
          </Button>
        </>
      )}
    </li>
  )
}

export function TasksScreen() {
  const [showDone, setShowDone] = useState(false)
  const tasks = useTasks(showDone ? {} : { done: false })

  return (
    <div className="mx-auto max-w-[900px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Feladatok</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            SLA-figyelt teendők leadhez/lehetőséghez kötve — a jelvény a határidőből számított
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-ink">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Teljesítettek is
        </label>
      </div>

      <QueryGate isPending={tasks.isPending} isError={tasks.isError}
        onRetry={() => void tasks.refetch()} resource="feladatok">
        {(tasks.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-1 px-4 py-10 text-center text-[12.5px] text-ink-muted">
            Nincs nyitott feladat.
          </div>
        ) : (
          <ul className="space-y-2">
            {(tasks.data ?? []).map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        )}
      </QueryGate>
    </div>
  )
}

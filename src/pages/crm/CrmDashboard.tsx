import { Card, StatusPill } from '../../components/ui'
import {
  useLeads, useOpps, useTasks, useRecentActivities,
  weightedValue, computeTaskSla, OPP_OPEN_STAGES,
} from '../../services/crm'
import { QueryGate } from '../ehs/QueryGate'
import { ACTIVITY_KIND_LABELS, OPP_STATUS_LABELS, formatMoney } from './labels'

/**
 * CRM áttekintés — KPI-k a query hookokból (pipeline érték, súlyozott
 * forecast, nyitott feladatok + SLA-sértés, lead-konverzió) + legutóbbi
 * tevékenységek. Minden érték az API-ból számított, nincs statikus adat.
 */
export function CrmDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const leads = useLeads()
  const opps = useOpps()
  const tasks = useTasks()
  const recent = useRecentActivities()

  const openOpps = (opps.data ?? []).filter((o) => (OPP_OPEN_STAGES as readonly string[]).includes(o.status))
  const pipeline = openOpps.reduce((s, o) => s + o.value, 0)
  const weighted = openOpps.reduce((s, o) => s + weightedValue(o.value, o.status), 0)

  const openTasks = (tasks.data ?? []).filter((t) => !t.done)
  const breaches = openTasks.filter((t) => computeTaskSla(t.due) === 'overdue').length

  const converted = (leads.data ?? []).filter((l) => l.status === 'konvertalva').length
  const closedLeads = (leads.data ?? []).filter((l) => ['konvertalva', 'elvetve'].includes(l.status)).length
  const convRate = closedLeads ? Math.round((converted / closedLeads) * 100) : 0

  const kpis = [
    { label: 'Pipeline érték', value: formatMoney(pipeline), sub: `${openOpps.length} nyitott lehetőség` },
    { label: 'Súlyozott forecast', value: formatMoney(weighted), sub: 'fázis-valószínűséggel súlyozva' },
    {
      label: 'Nyitott feladatok', value: String(openTasks.length),
      sub: breaches > 0 ? `${breaches} SLA-sértés` : 'nincs SLA-sértés',
      alert: breaches > 0,
    },
    { label: 'Lead-konverzió', value: `${convRate}%`, sub: `${converted}/${closedLeads} lezárt leadből` },
  ]

  const anyPending = leads.isPending || opps.isPending || tasks.isPending
  const anyError = leads.isError || opps.isError || tasks.isError

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div className="mb-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Lead → lehetőség pipeline, feladat-SLA és a legutóbbi tevékenységek
        </p>
      </div>

      <QueryGate isPending={anyPending} isError={anyError} resource="CRM áttekintés"
        onRetry={() => { void leads.refetch(); void opps.refetch(); void tasks.refetch() }}>
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
          {/* Nyitott lehetőségek kivonat */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Nyitott lehetőségek</h2>
              <button
                onClick={() => onScreen('pipeline')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Pipeline →
              </button>
            </div>
            <ul className="space-y-2">
              {openOpps.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-ink">{o.customer}</div>
                    <div className="truncate text-[10.5px] text-ink-muted">{o.title}</div>
                  </div>
                  <StatusPill size="sm" fsm="crmOpportunity" status={o.status}
                    label={OPP_STATUS_LABELS[o.status]} />
                  <div className="w-20 text-right text-[12px] font-semibold tabular-nums text-ink">
                    {formatMoney(o.value)}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Legutóbbi tevékenységek */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Legutóbbi tevékenységek</h2>
              <button
                onClick={() => onScreen('tasks')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Feladatok →
              </button>
            </div>
            <QueryGate isPending={recent.isPending} isError={recent.isError}
              onRetry={() => void recent.refetch()} resource="tevékenységek">
              <ul className="space-y-2.5">
                {(recent.data ?? []).map((a, i) => (
                  <li key={`${a.refId}-${a.at}-${i}`} className="flex gap-2 text-[11.5px]">
                    <StatusPill size="sm" tone="neutral" label={ACTIVITY_KIND_LABELS[a.kind]} />
                    <div className="min-w-0">
                      <div className="font-mono text-[10.5px] text-ink-muted">
                        {a.at} · <span className="text-ink">{a.refId}</span>
                      </div>
                      <div className="truncate text-ink">{a.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </QueryGate>
          </Card>
        </div>
      </QueryGate>
    </div>
  )
}

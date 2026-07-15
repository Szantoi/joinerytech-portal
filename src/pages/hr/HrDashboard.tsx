import { Card, Icon, StatusPill } from '../../components/ui'
import {
  useAbsences, useEmployees, useWeekCapacity,
  capacityWeekOf, todayIso, isWorkday,
  isAbsenceBlocking, isAbsenceRequested,
} from '../../services/hr'
import { QueryGate } from '../ehs/QueryGate'
import {
  ABSENCE_STATUS_LABELS, ABSENCE_TYPE_META, formatDate, formatHours,
} from './labels'
import { EmployeeAvatar } from './EmployeeAvatar'

/**
 * HR áttekintés — KPI-k a query hookokból (mai jelenlét, kapacitás-
 * kihasználtság, túlterheltek, nyitott kérelmek) + túlterhelés-lista és
 * nyitott kérelmek. Minden érték az API-ból számított, nincs statikus adat.
 */
export function HrDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const today = todayIso()
  const week = capacityWeekOf(today)
  const employees = useEmployees()
  const capacity = useWeekCapacity(week)
  const absences = useAbsences()

  const emps = employees.data ?? []
  const rows = capacity.data?.rows ?? []
  const abs = absences.data ?? []

  // Mai jelenlét: blokkoló távollét a mai napon → távol (hétvégén nincs műszak)
  const absentToday = emps.filter((e) =>
    abs.some((a) => a.empId === e.id && isAbsenceBlocking(a.status) && today >= a.start && today <= a.end),
  )
  const presentCount = isWorkday(today) ? emps.length - absentToday.length : 0

  const totalCap = rows.reduce((s, r) => s + r.capacity, 0)
  const totalAssigned = rows.reduce((s, r) => s + r.assigned, 0)
  const utilization = totalCap > 0 ? totalAssigned / totalCap : 0

  const overloadedRows = rows.filter((r) => r.days.some((d) => d.overloaded))
  const openRequests = abs.filter((a) => isAbsenceRequested(a.status))

  const kpis = [
    {
      label: 'Mai jelenlét',
      value: isWorkday(today) ? `${presentCount}/${emps.length} fő` : '— (hétvége)',
      sub: absentToday.length > 0 ? `${absentToday.length} fő távol ma` : 'senki sincs távol',
    },
    {
      label: 'Kapacitás-kihasználtság',
      value: `${Math.round(utilization * 100)}%`,
      sub: `${formatHours(totalAssigned)} / ${formatHours(totalCap)} · ${week} hét`,
    },
    {
      label: 'Túlterheltek',
      value: `${overloadedRows.length} fő`,
      sub: overloadedRows.length > 0 ? 'kapacitás felett beosztva' : 'nincs túlterhelés a héten',
      alert: overloadedRows.length > 0,
    },
    {
      label: 'Nyitott kérelmek',
      value: String(openRequests.length),
      sub: 'döntésre váró távollét',
      alert: openRequests.length > 0,
    },
  ]

  const empById = new Map(emps.map((e) => [e.id, e]))

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Áttekintés</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Munkaerő-kapacitás, jelenlét és távollét — {week} hét
        </p>
      </div>

      <QueryGate
        isPending={employees.isPending || capacity.isPending || absences.isPending}
        isError={employees.isError || capacity.isError || absences.isError}
        resource="HR áttekintés"
        onRetry={() => {
          void employees.refetch(); void capacity.refetch(); void absences.refetch()
        }}
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
          {/* Túlterheltek a héten */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Túlterheltek a héten</h2>
              <button
                onClick={() => onScreen('capacity')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Kapacitás-rács →
              </button>
            </div>
            {overloadedRows.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Senki sincs a kapacitása felett beosztva.</p>
            ) : (
              <ul className="space-y-2.5">
                {overloadedRows.map((r) => {
                  const emp = empById.get(r.empId)
                  const overDays = r.days.filter((d) => d.overloaded)
                  const overHours = overDays.reduce((s, d) => s + (d.assigned - d.capacity), 0)
                  return (
                    <li key={r.empId} className="flex items-center gap-3">
                      {emp && <EmployeeAvatar color={emp.color} initials={emp.initials} size={28} />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-ink">{emp?.name ?? r.empId}</div>
                        <div className="text-[10.5px] text-ink-muted">
                          {overDays.length} túlterhelt nap · +{formatHours(overHours)} kapacitás felett
                        </div>
                      </div>
                      {/* nem csak szín: ikon + szöveges pill */}
                      <span aria-hidden="true" className="text-rose-600 dark:text-rose-400">
                        <Icon name="alert" size={15} />
                      </span>
                      <StatusPill size="sm" tone="danger" label="Túlterhelt" />
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Nyitott kérelmek */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">
                Nyitott kérelmek{openRequests.length ? ` (${openRequests.length})` : ''}
              </h2>
              <button
                onClick={() => onScreen('absences')}
                className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
              >
                Távollét →
              </button>
            </div>
            {openRequests.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nincs döntésre váró kérelem.</p>
            ) : (
              <ul className="space-y-2.5">
                {openRequests.map((a) => {
                  const emp = empById.get(a.empId)
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      {emp && <EmployeeAvatar color={emp.color} initials={emp.initials} size={28} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-medium text-ink">{a.empName}</span>
                          <StatusPill size="sm" tone={ABSENCE_TYPE_META[a.type].tone} label={ABSENCE_TYPE_META[a.type].label} />
                        </div>
                        <div className="font-mono text-[10.5px] text-ink-muted">
                          {formatDate(a.start)} – {formatDate(a.end)} · {a.days} munkanap
                        </div>
                      </div>
                      <StatusPill size="sm" fsm="hrTavollet" status={a.status} label={ABSENCE_STATUS_LABELS[a.status]} />
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Heti terhelés dolgozónként (kivonat) */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-ink">Heti terhelés dolgozónként</h2>
            <button
              onClick={() => onScreen('people')}
              className="rounded text-[11.5px] font-medium text-world-soft-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
            >
              Dolgozók →
            </button>
          </div>
          <ul>
            {rows.map((r) => {
              const emp = empById.get(r.empId)
              if (!emp) return null
              const pct = Math.min(100, Math.round(r.utilization * 100))
              const over = r.days.some((d) => d.overloaded)
              return (
                <li key={r.empId} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
                  <EmployeeAvatar color={emp.color} initials={emp.initials} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-ink">{emp.name}</div>
                    <div className="truncate text-[10.5px] text-ink-muted">{emp.role}</div>
                  </div>
                  <div className="hidden w-[160px] shrink-0 md:block">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-ink-muted">
                      <span>terhelés</span>
                      <span className="tabular-nums">
                        {formatHours(r.assigned)} / {formatHours(r.capacity)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="presentation">
                      <div
                        className={`h-full ${over ? 'bg-rose-500 dark:bg-rose-400' : pct > 85 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {over && <StatusPill size="sm" tone="danger" label="Túlterhelt" />}
                </li>
              )
            })}
          </ul>
        </Card>
      </QueryGate>
    </div>
  )
}

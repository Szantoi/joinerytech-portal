import { useState } from 'react'
import { Button, Card } from '../../components/ui'
import {
  addDays, capacityWeekOf, loadBand, todayIso,
  useEmployees, useWeekCapacity, type DayLoad,
} from '../../services/hr'
import { QueryGate } from '../ehs/QueryGate'
import { ABSENCE_TYPE_META, LOAD_BAND_META, formatGridDay, formatHours } from './labels'
import { EmployeeAvatar } from './EmployeeAvatar'
import { EmployeeDetailSlideOver } from './EmployeeDetailSlideOver'
import type { AbsenceType } from '../../services/hr/absences'

/**
 * Kapacitás-rács — heti (H–P) nézet, dolgozó × nap cellákkal. A rács
 * SZERVER-számított (/capacity — services/hr/calc.ts, amit az MSW is futtat);
 * a kliens csak megjelenít. Hét-léptetés, terhelés-sávok (címke+szín, nem csak
 * szín), távollét-cellák; a rács SAJÁT görgethető régió (Kontrolling S1-lecke).
 */

function dayCellClasses(load: DayLoad): string {
  if (!load.workday) return 'bg-surface-2/60 text-ink-muted'
  if (load.absence) return 'bg-surface-2 text-ink-muted'
  const band = loadBand(load.assigned, load.capacity)
  if (band === 'over') return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-400 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500'
  if (band === 'high') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  if (band === 'ok') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  return 'bg-surface-1 text-ink-muted'
}

function absenceShort(type: string): string {
  return ABSENCE_TYPE_META[type as AbsenceType]?.label ?? 'Távollét'
}

export function CapacityScreen() {
  const [week, setWeek] = useState(() => capacityWeekOf(todayIso()))
  const employees = useEmployees()
  const capacity = useWeekCapacity(week)
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null)

  const empById = new Map((employees.data ?? []).map((e) => [e.id, e]))
  const days = capacity.data?.days ?? []
  const rows = capacity.data?.rows ?? []
  const today = todayIso()

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Kapacitás-rács</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Heti terhelés dolgozónként — szerver-számított rács, {week} hét
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Hét-léptetés">
          <Button size="sm" variant="secondary" onClick={() => setWeek((w) => addDays(w, -7))}>
            ← Előző hét
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeek(capacityWeekOf(todayIso()))}>
            Aktuális
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeek((w) => addDays(w, 7))}>
            Következő hét →
          </Button>
        </div>
      </div>

      <QueryGate
        isPending={employees.isPending || capacity.isPending}
        isError={employees.isError || capacity.isError}
        onRetry={() => { void employees.refetch(); void capacity.refetch() }}
        resource="kapacitás-rács"
      >
        <Card className="overflow-hidden p-0">
          {/* Saját görgethető régió (spec 2.4; Kontrolling S1-lecke): széles rács
              mobilon a konténerben görög, nem az oldal csúszik. */}
          <div
            role="region"
            aria-label={`Kapacitás-rács, ${week} hét`}
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <table className="w-full min-w-[760px] text-[11.5px]">
              <caption className="sr-only">
                Heti kapacitás-rács: dolgozónként a napi lekötött és elérhető órák, túlterhelés- és távollét-jelzéssel
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-2/60">
                  <th scope="col" className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Dolgozó
                  </th>
                  {days.map((d) => (
                    <th
                      key={d} scope="col"
                      className={`px-1.5 py-2 text-center text-[10.5px] font-medium uppercase tracking-wide ${
                        d === today ? 'bg-world-soft text-world-soft-fg' : 'text-ink-muted'
                      }`}
                    >
                      {formatGridDay(d)}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Hét
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((row) => {
                  const emp = empById.get(row.empId)
                  if (!emp) return null
                  const weekBand = loadBand(row.assigned, row.capacity)
                  return (
                    <tr key={row.empId}>
                      <th scope="row" className="px-3 py-1.5 text-left font-normal">
                        <button
                          onClick={() => setSelectedEmpId(emp.id)}
                          className="flex items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                        >
                          <EmployeeAvatar color={emp.color} initials={emp.initials} size={26} />
                          <span className="min-w-0">
                            <span className="block max-w-[140px] truncate text-[11.5px] font-semibold text-ink underline-offset-2 hover:underline">
                              {emp.name}
                            </span>
                            <span className="block text-[10px] text-ink-muted">{emp.weeklyHours} ó/hét</span>
                          </span>
                        </button>
                      </th>
                      {row.days.map((d) => (
                        <td key={d.day} className="p-1 text-center">
                          <div className={`grid min-h-[38px] place-items-center rounded-lg px-1 py-1 ${dayCellClasses(d)}`}>
                            {!d.workday ? (
                              <span aria-label="hétvége">—</span>
                            ) : d.absence ? (
                              <span className="text-[10px] font-medium">{absenceShort(d.absence.type)}</span>
                            ) : (
                              <span className="tabular-nums">
                                <span className="font-semibold">{String(d.assigned).replace('.', ',')}</span>
                                <span className="opacity-70">/{String(d.capacity).replace('.', ',')}</span>
                                {d.overloaded && <span className="sr-only"> — túlterhelt</span>}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-right">
                        <span className="tabular-nums text-ink">
                          {formatHours(row.assigned)} / {formatHours(row.capacity)}
                        </span>
                        <span className="block text-[10px] text-ink-muted">{LOAD_BAND_META[weekBand].label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Jelmagyarázat — szín + szöveg (nem csak szín) */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800" />
            {LOAD_BAND_META.ok.label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800" />
            {LOAD_BAND_META.high.label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-rose-50 ring-1 ring-rose-400 dark:bg-rose-950/40 dark:ring-rose-500" />
            {LOAD_BAND_META.over.label} (lekötés &gt; kapacitás)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-surface-2 ring-1 ring-line" />
            távollét / hétvége
          </span>
        </div>
      </QueryGate>

      <EmployeeDetailSlideOver empId={selectedEmpId} onClose={() => setSelectedEmpId(null)} />
    </div>
  )
}

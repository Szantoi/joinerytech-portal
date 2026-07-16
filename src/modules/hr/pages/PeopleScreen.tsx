import { useState } from 'react'
import { DataTable, Icon, QueryGate, StatusPill, type DataTableColumn } from '../../../components/ui'
import {
  capacityWeekOf, loadBand, todayIso,
  useEmployees, useWeekCapacity, type Employee, type HrDept,
} from '../services'
import {
  DEPT_META, DEPT_ORDER, LOAD_BAND_META, SKILL_LABELS, SKILL_LEVEL_META,
  formatHours,
} from './labels'
import { EmployeeAvatar } from './EmployeeAvatar'
import { EmployeeDetailSlideOver } from './EmployeeDetailSlideOver'

/**
 * Dolgozók — DataTable (kettős render) részleg-szűrővel és keresővel
 * (mindkettő SZERVER-oldali: dept/q query-paraméter), heti terhelés-oszloppal
 * (a /capacity számított rácsából); sor-cím → dolgozó-profil SlideOver.
 */

const DEPT_FILTERS = ['all', ...DEPT_ORDER] as const
type DeptFilter = (typeof DEPT_FILTERS)[number]

export function PeopleScreen() {
  const [dept, setDept] = useState<DeptFilter>('all')
  const [q, setQ] = useState('')
  const employees = useEmployees({
    ...(dept !== 'all' ? { dept } : {}),
    ...(q.trim() !== '' ? { q: q.trim() } : {}),
  })
  const capacity = useWeekCapacity(capacityWeekOf(todayIso()))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const capByEmp = new Map((capacity.data?.rows ?? []).map((r) => [r.empId, r]))

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'name', header: 'Dolgozó', sortable: true, mobile: 'title',
      sortValue: (e) => e.name,
      render: (e) => (
        <button
          onClick={() => setSelectedId(e.id)}
          className="flex items-center gap-2.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          <EmployeeAvatar color={e.color} initials={e.initials} size={32} />
          <span className="min-w-0">
            <span className="block max-w-[180px] truncate text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline">
              {e.name}
            </span>
            <span className="block truncate text-[10.5px] text-ink-muted">{e.role}</span>
          </span>
        </button>
      ),
    },
    {
      key: 'dept', header: 'Részleg',
      render: (e) => <StatusPill size="sm" tone={DEPT_META[e.dept].tone} label={DEPT_META[e.dept].label} />,
    },
    {
      key: 'skills', header: 'Készségek', mobile: 'hidden',
      render: (e) => (
        <span className="flex max-w-[260px] flex-wrap gap-1">
          {e.skills.slice(0, 3).map((sk) => (
            <StatusPill
              key={sk.key} size="sm" tone={SKILL_LEVEL_META[sk.level].tone}
              label={`${SKILL_LABELS[sk.key]} · ${SKILL_LEVEL_META[sk.level].short}`}
            />
          ))}
          {e.skills.length > 3 && (
            <span className="text-[10.5px] text-ink-muted">+{e.skills.length - 3}</span>
          )}
        </span>
      ),
    },
    {
      key: 'load', header: 'Heti terhelés', sortable: true,
      sortValue: (e) => capByEmp.get(e.id)?.utilization ?? 0,
      render: (e) => {
        const row = capByEmp.get(e.id)
        if (!row) return <span className="text-ink-muted">—</span>
        const band = loadBand(row.assigned, row.capacity)
        return (
          <span className="inline-flex items-center gap-2">
            <span className="tabular-nums text-[11.5px] text-ink">
              {formatHours(row.assigned)} / {formatHours(row.capacity)}
            </span>
            <StatusPill size="sm" tone={LOAD_BAND_META[band].tone} label={LOAD_BAND_META[band].label} />
          </span>
        )
      },
    },
    {
      key: 'weeklyHours', header: 'Óraszám', sortable: true, mobile: 'meta',
      sortValue: (e) => e.weeklyHours,
      render: (e) => (
        <span className="tabular-nums text-ink-muted">
          {e.weeklyHours} ó/hét{e.employment === 'part' ? ' · részmunka' : ''}
        </span>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Dolgozók</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Törzsadat, készségek és heti terhelés — {(employees.data ?? []).length} dolgozó
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <span aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
            <Icon name="search" size={15} />
          </span>
          <label className="sr-only" htmlFor="people-search">Keresés név vagy szerep szerint</label>
          <input
            id="people-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés név / szerep…"
            className="h-9 w-full rounded-lg border border-line bg-surface-1 pl-8 pr-3 text-[12.5px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Részleg-szűrő">
          {DEPT_FILTERS.map((d) => (
            // Aktív chip: pipa + font-semibold + 44 px touch-cél (Kontrolling S2 minta)
            <button
              key={d}
              onClick={() => setDept(d)}
              aria-pressed={dept === d}
              className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
                dept === d
                  ? 'bg-world font-semibold text-world-fg'
                  : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
              }`}
            >
              {dept === d && (
                <span aria-hidden="true" className="inline-flex">
                  <Icon name="check" size={12} />
                </span>
              )}
              {d === 'all' ? 'Összes' : DEPT_META[d as HrDept].label}
            </button>
          ))}
        </div>
      </div>

      <QueryGate isPending={employees.isPending} isError={employees.isError}
        onRetry={() => void employees.refetch()} resource="dolgozók">
        <DataTable
          columns={columns}
          rows={employees.data ?? []}
          rowKey={(e) => e.id}
          caption="Dolgozók részleggel, készségekkel és heti terheléssel"
          emptyMessage="Nincs a szűrésnek megfelelő dolgozó."
        />
      </QueryGate>

      <EmployeeDetailSlideOver empId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

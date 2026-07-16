import { useState } from 'react'
import { Card, Icon, QueryGate, StatusPill } from '../../../components/ui'
import { useEmployees, type SkillKey, type SkillLevel } from '../services'
import { SKILL_LABELS, SKILL_LEVEL_META, SKILL_ORDER } from './labels'
import { EmployeeAvatar } from './EmployeeAvatar'
import { EmployeeDetailSlideOver } from './EmployeeDetailSlideOver'

/**
 * Készség-mátrix — dolgozó × készség rács szintezett cellákkal (1=alap,
 * 2=rutin, 3=mester; a szint SZÁMKÉNT is látszik — nem csak szín). Készség-
 * szűrő chipekkel (SZERVER-oldali skill paraméter); lefedettség-összesítő
 * lábléccel; a széles mátrix SAJÁT görgethető régió (Kontrolling S1-lecke).
 */

const SKILL_FILTERS = ['all', ...SKILL_ORDER] as const
type SkillFilter = (typeof SKILL_FILTERS)[number]

function levelCell(level: SkillLevel | undefined) {
  if (level === undefined) {
    return <span aria-label="nincs készség" className="text-[11px] text-ink-muted/60">—</span>
  }
  const meta = SKILL_LEVEL_META[level]
  return <StatusPill size="sm" tone={meta.tone} label={`${meta.short} · ${meta.label}`} />
}

export function SkillsScreen() {
  const [skill, setSkill] = useState<SkillFilter>('all')
  const employees = useEmployees(skill === 'all' ? {} : { skill })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = employees.data ?? []
  const skillCols: SkillKey[] = skill === 'all' ? SKILL_ORDER : [skill]

  /** Lefedettség: hány dolgozó bírja az adott készséget (és hány mesterként). */
  const coverage = (key: SkillKey) => {
    const holders = rows.filter((e) => e.skills.some((s) => s.key === key))
    const masters = holders.filter((e) => e.skills.some((s) => s.key === key && s.level === 3))
    return { holders: holders.length, masters: masters.length }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Készség-mátrix</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Ki mihez ért és milyen szinten — 1 alap · 2 rutin · 3 mester
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Készség-szűrő">
        {SKILL_FILTERS.map((s) => (
          // Aktív chip: pipa + font-semibold + 44 px touch-cél (Kontrolling S2 minta)
          <button
            key={s}
            onClick={() => setSkill(s)}
            aria-pressed={skill === s}
            className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
              skill === s
                ? 'bg-world font-semibold text-world-fg'
                : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
            }`}
          >
            {skill === s && (
              <span aria-hidden="true" className="inline-flex">
                <Icon name="check" size={12} />
              </span>
            )}
            {s === 'all' ? 'Mind' : SKILL_LABELS[s as SkillKey]}
          </button>
        ))}
      </div>

      <QueryGate isPending={employees.isPending} isError={employees.isError}
        onRetry={() => void employees.refetch()} resource="készség-mátrix">
        <Card className="overflow-hidden p-0">
          {/* Saját görgethető régió (spec 2.4; Kontrolling S1-lecke) */}
          <div
            role="region"
            aria-label="Készség-mátrix"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <table className={`w-full text-[11.5px] ${skill === 'all' ? 'min-w-[900px]' : ''}`}>
              <caption className="sr-only">
                Készség-mátrix: dolgozónként a készségek szintje (1 alap, 2 rutin, 3 mester)
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-2/60">
                  <th scope="col" className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                    Dolgozó
                  </th>
                  {skillCols.map((key) => (
                    <th key={key} scope="col" className="px-2 py-2 text-center text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                      {SKILL_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((emp) => {
                  const byKey = new Map(emp.skills.map((s) => [s.key, s.level]))
                  return (
                    <tr key={emp.id}>
                      <th scope="row" className="px-3 py-1.5 text-left font-normal">
                        <button
                          onClick={() => setSelectedId(emp.id)}
                          className="flex items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                        >
                          <EmployeeAvatar color={emp.color} initials={emp.initials} size={26} />
                          <span className="min-w-0">
                            <span className="block max-w-[150px] truncate text-[11.5px] font-semibold text-ink underline-offset-2 hover:underline">
                              {emp.name}
                            </span>
                            <span className="block truncate text-[10px] text-ink-muted">{emp.role}</span>
                          </span>
                        </button>
                      </th>
                      {skillCols.map((key) => (
                        <td key={key} className="px-2 py-1.5 text-center">
                          {levelCell(byKey.get(key))}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {rows.length > 0 && (
                  <tr className="border-t border-line bg-surface-2/40 text-[10.5px] text-ink-muted">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      Lefedettség ({rows.length} fő)
                    </th>
                    {skillCols.map((key) => {
                      const c = coverage(key)
                      return (
                        <td key={key} className="px-2 py-2 text-center tabular-nums">
                          {c.holders} fő{c.masters > 0 ? ` · ${c.masters} mester` : ''}
                        </td>
                      )
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-[12px] text-ink-muted">
              Nincs a szűrésnek megfelelő dolgozó.
            </p>
          )}
        </Card>
      </QueryGate>

      <EmployeeDetailSlideOver empId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

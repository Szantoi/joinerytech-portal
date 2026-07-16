import { Button, SlideOver, StatusPill } from '../../../components/ui'
import {
  useAbsences, useAssignments, useEmployee, useHrPermissions, usePushTimeLogs,
  useTimeLogs, isTimeLogPushable, manageBlockReason,
} from '../services'
import {
  ABSENCE_STATUS_LABELS, ABSENCE_TYPE_META, DEPT_META, EMPLOYMENT_LABELS,
  PAY_GRADE_LABELS, SKILL_LABELS, SKILL_LEVEL_META,
  formatDate, formatHours, formatRate,
} from './labels'
import { EmployeeAvatar } from './EmployeeAvatar'

/**
 * Dolgozó-profil SlideOver — készségek (szintezett pillek), bérsáv,
 * beosztások, munkaóra-napló (Kontrolling-átadás stubbal) és távollétek.
 */

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
      {children}
    </h3>
  )
}

function TimeLogSection({ empId }: { empId: string }) {
  const timeLogs = useTimeLogs({ empId })
  const push = usePushTimeLogs()
  const { canManage } = useHrPermissions()

  const logs = timeLogs.data ?? []
  const pushable = logs.filter(isTimeLogPushable)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <SectionTitle>Munkaóra-napló</SectionTitle>
        <Button
          size="sm"
          variant="secondary"
          icon="send"
          disabledReason={
            manageBlockReason(canManage) ??
            (push.isPending
              ? 'Folyamatban…'
              : pushable.length === 0
                ? 'Nincs átadható tétel.'
                : undefined)
          }
          onClick={() => push.mutate(empId)}
        >
          Kontrolling felé ({pushable.length})
        </Button>
      </div>
      {logs.length === 0 ? (
        <p className="text-[11.5px] text-ink-muted">Nincs rögzített munkaóra.</p>
      ) : (
        <ul className="space-y-1.5">
          {logs.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] font-medium text-ink">{t.projectName}</div>
                <div className="font-mono text-[10.5px] text-ink-muted">
                  {formatDate(t.day)} · {formatHours(t.hours)}
                  {t.note ? ` · ${t.note}` : ''}
                </div>
              </div>
              {t.pushedAt === null ? (
                <StatusPill size="sm" tone="warn" label="Átadásra vár" />
              ) : (
                <StatusPill size="sm" tone="terminal" label="Átadva" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function EmployeeDetailSlideOver({
  empId,
  onClose,
}: {
  empId: string | null
  onClose: () => void
}) {
  const { data: emp, isPending, isError } = useEmployee(empId)
  const assignments = useAssignments(empId ? { empId } : {})
  const absences = useAbsences(empId ? { empId } : {})
  if (empId === null) return null

  return (
    <SlideOver open onClose={onClose} title={emp?.name ?? empId}
      subtitle={emp?.role} width={560}>
      <div className="space-y-5 px-5 py-5">
        {isPending && <div aria-busy="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />}
        {isError && <p role="alert" className="text-[12.5px] text-ink-muted">A dolgozó betöltése nem sikerült.</p>}

        {emp && (
          <>
            <div className="flex items-center gap-3">
              <EmployeeAvatar color={emp.color} initials={emp.initials} size={48} />
              <div className="min-w-0">
                <StatusPill size="sm" tone={DEPT_META[emp.dept].tone} label={DEPT_META[emp.dept].label} />
                <div className="mt-1 truncate text-[11px] text-ink-muted">
                  {emp.email} · {emp.phone}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Bérsáv</div>
                <div className="font-medium text-ink">{PAY_GRADE_LABELS[emp.payGrade]}</div>
                <div className="text-[11px] tabular-nums text-ink-muted">{formatRate(emp.hourlyRate)}</div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Foglalkoztatás</div>
                <div className="font-medium text-ink">{EMPLOYMENT_LABELS[emp.employment]}</div>
                <div className="text-[11px] tabular-nums text-ink-muted">{emp.weeklyHours} ó/hét</div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Belépett</div>
                <div className="text-ink">{formatDate(emp.startedAt)}</div>
              </div>
            </div>

            {emp.skills.length > 0 && (
              <div>
                <SectionTitle>Készségek</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {emp.skills.map((sk) => (
                    <StatusPill
                      key={sk.key}
                      size="sm"
                      tone={SKILL_LEVEL_META[sk.level].tone}
                      label={`${SKILL_LABELS[sk.key]} · ${SKILL_LEVEL_META[sk.level].short}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionTitle>Beosztások</SectionTitle>
              {(assignments.data ?? []).length === 0 ? (
                <p className="text-[11.5px] text-ink-muted">Nincs aktív beosztás.</p>
              ) : (
                <ul className="space-y-1.5">
                  {(assignments.data ?? []).map((a) => (
                    <li key={a.id} className="rounded-lg bg-surface-2/60 px-3 py-2">
                      <div className="truncate text-[11.5px] font-medium text-ink">
                        {a.projectName} — {a.label}
                      </div>
                      <div className="font-mono text-[10.5px] text-ink-muted">
                        {formatDate(a.start)} – {formatDate(a.end)} · {formatHours(a.hoursPerDay)}/nap
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <TimeLogSection empId={emp.id} />

            {(absences.data ?? []).length > 0 && (
              <div>
                <SectionTitle>Távollétek</SectionTitle>
                <ul className="space-y-1.5">
                  {(absences.data ?? []).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <StatusPill size="sm" tone={ABSENCE_TYPE_META[a.type].tone} label={ABSENCE_TYPE_META[a.type].label} />
                        <div className="mt-0.5 font-mono text-[10.5px] text-ink-muted">
                          {formatDate(a.start)} – {formatDate(a.end)} · {a.days} munkanap
                        </div>
                      </div>
                      <StatusPill size="sm" fsm="hrTavollet" status={a.status} label={ABSENCE_STATUS_LABELS[a.status]} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </SlideOver>
  )
}

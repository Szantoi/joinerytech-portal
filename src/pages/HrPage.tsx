import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  EMPLOYEES, ABSENCES, HR_ASSIGNMENTS,
  HR_DEPT_META, HR_DEPT_ORDER, HR_PAY_GRADE_META, HR_SKILL_META, HR_SKILL_LEVEL_META,
  ABS_TYPE_META, ABS_STATUS_META, ABS_BLOCKING,
  dayLoad, weekSummary, mondayOf, dayCapacity, isWorkday, hrFmt, hrParse,
  type Employee, type HrAbsence, type HrDeptKey,
} from '../mocks/hr'

const HR_TODAY = '2026-04-28'
const HR_DAY_MS = 86400000
const DOW = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Avatar({ emp, size = 34 }: { emp: Employee; size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: emp.color || '#0d9488', fontSize: size * 0.38 }}
    >
      {emp.initials}
    </span>
  )
}

function DeptPill({ dept, size = 'md' }: { dept: HrDeptKey; size?: 'sm' | 'md' }) {
  const m = HR_DEPT_META[dept]
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${cls} ${m.pill}`}>
      {m.label}
    </span>
  )
}

function SkillChip({ sk }: { sk: { key: string; level: 1 | 2 | 3 } }) {
  const m = HR_SKILL_META[sk.key as keyof typeof HR_SKILL_META]
  const lv = HR_SKILL_LEVEL_META[sk.level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 h-5 text-[10px] font-medium ${lv.pill}`}>
      {m?.label ?? sk.key}<span className="opacity-60">·{lv.short}</span>
    </span>
  )
}

function AbsStatusPill({ status }: { status: HrAbsence['status'] }) {
  const m = ABS_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 h-6 text-[10.5px] font-medium ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function AbsTypeBadge({ type }: { type: HrAbsence['type'] }) {
  const m = ABS_TYPE_META[type]
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: m.accent }}>
      {m.label}
    </span>
  )
}

function UtilBar({ util }: { util: number }) {
  const fill = Math.min(100, util * 100)
  const over = util > 1
  const tone = over ? 'bg-rose-500' : util > 0.85 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
      <div className={`h-full ${tone}`} style={{ width: fill + '%' }} />
    </div>
  )
}

// ── Employee Detail SlideOver ──────────────────────────────────────────────────
function EmployeeDetailSlideOver({ emp, onClose }: { emp: Employee | null; onClose: () => void }) {
  if (!emp) return null
  const monday = mondayOf(HR_TODAY)
  const ws = weekSummary(emp, monday)
  const empAbsences = ABSENCES.filter((a) => a.empId === emp.id)
  const pg = HR_PAY_GRADE_META[emp.payGrade]

  return (
    <SlideOver open={true} onClose={onClose} title={emp.name} subtitle={emp.role} width={560}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3">
          <Avatar emp={emp} size={48} />
          <div>
            <DeptPill dept={emp.dept} />
            <div className="text-[11px] text-stone-400 mt-1">{emp.email} · {emp.phone}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Bér-kategória</div>
            <div className="text-[12.5px] font-medium text-stone-800">{pg?.label ?? emp.payGrade}</div>
            <div className="text-[11px] text-stone-400">{pg?.rate?.toLocaleString('hu-HU')} Ft/ó</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Foglalkoztatás</div>
            <div className="text-[12.5px] font-medium text-stone-800">
              {emp.employment === 'part' ? 'Részmunkaidő' : 'Teljes munkaidő'} · {emp.weeklyHours}ó/hét
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Heti kapacitás</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11.5px] text-stone-600">Lekötött / kapacitás</span>
            <span className="text-[11.5px] tabular-nums text-stone-800 font-medium">
              {Math.round(ws.load)} / {Math.round(ws.capacity)} ó
            </span>
          </div>
          <UtilBar util={ws.util} />
        </div>

        {emp.skills.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Készségek</div>
            <div className="flex flex-wrap gap-1.5">
              {emp.skills.map((sk) => <SkillChip key={sk.key} sk={sk} />)}
            </div>
          </div>
        )}

        {empAbsences.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Távollétek</div>
            <div className="space-y-2">
              {empAbsences.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2">
                  <div>
                    <AbsTypeBadge type={a.type} />
                    <div className="text-[10.5px] text-stone-400 mt-0.5">{a.start} – {a.end} · {a.days} munkanap</div>
                  </div>
                  <AbsStatusPill status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-[11px] text-stone-500">
          <div><span className="text-stone-400">Belépett:</span> {emp.startedAt}</div>
          {emp.personal?.children != null && (
            <div><span className="text-stone-400">Gyermek:</span> {emp.personal.children} fő</div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

// ── HR Dashboard ───────────────────────────────────────────────────────────────
function HrDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [openEmp, setOpenEmp] = useState<Employee | null>(null)
  const monday = mondayOf(HR_TODAY)

  const weekStats = EMPLOYEES.map((e) => weekSummary(e, monday))
  const totalCap  = weekStats.reduce((s, w) => s + w.capacity, 0)
  const totalLoad = weekStats.reduce((s, w) => s + w.load, 0)
  const util = totalCap > 0 ? totalLoad / totalCap : 0

  // Today's presence
  const todayAbsent = EMPLOYEES.filter((e) => {
    const abs = ABSENCES.find((a) => a.empId === e.id && ABS_BLOCKING.includes(a.status) && HR_TODAY >= a.start && HR_TODAY <= a.end)
    return !!abs
  })
  const todayPresent = EMPLOYEES.filter((e) => !todayAbsent.includes(e))

  const openReqs = ABSENCES.filter((a) => a.status === 'kert')

  const KPI = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'rose' | 'emerald' }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="text-[11px] uppercase tracking-wide text-stone-400 font-medium">{label}</div>
      <div className={`text-[22px] font-semibold leading-none mt-1.5 ${tone === 'rose' ? 'text-rose-700' : tone === 'emerald' ? 'text-emerald-700' : 'text-stone-900'}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-stone-400 mt-1">{sub}</div>}
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">HR / Kapacitás</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Munkaerő-kapacitás, jelenlét és távollét — {monday}</p>
        </div>
        <button onClick={() => onScreen('people')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="user" size={15} />Dolgozók
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI label="Létszám"       value={`${EMPLOYEES.length} fő`}    sub={`${todayPresent.length} bent · ${todayAbsent.length} távol ma`} />
        <KPI label="Heti kapacitás" value={`${Math.round(totalCap)} ó`} sub={`${EMPLOYEES.length} dolgozó · 5 munkanap`} />
        <KPI label="Lekötött"      value={`${Math.round(totalLoad)} ó`} sub={`Szabad: ${Math.round(totalCap - totalLoad)} ó`} />
        <KPI label="Kihasználtság" value={`${Math.round(util * 100)}%`} sub="aktuális hét" tone={util > 1 ? 'rose' : 'emerald'} />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {/* today presence */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] font-semibold text-stone-800">Mai jelenlét</span>
            <span className="text-[11px] text-stone-400">{HR_TODAY}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: (todayPresent.length / Math.max(1, EMPLOYEES.length) * 100) + '%' }} />
            </div>
            <span className="text-[11.5px] text-stone-500 tabular-nums shrink-0">{todayPresent.length}/{EMPLOYEES.length} bent</span>
          </div>
          {todayAbsent.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-400 font-medium">Ma távol</div>
              {todayAbsent.map((e) => {
                const abs = ABSENCES.find((a) => a.empId === e.id && ABS_BLOCKING.includes(a.status) && HR_TODAY >= a.start && HR_TODAY <= a.end)
                return (
                  <button key={e.id} onClick={() => setOpenEmp(e)}
                    className="w-full flex items-center gap-2.5 text-left hover:bg-stone-50/70 rounded-lg px-1 py-1">
                    <Avatar emp={e} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-stone-800 truncate">{e.name}</div>
                      <div className="text-[10.5px] text-stone-400 truncate">{e.role}</div>
                    </div>
                    {abs && <AbsTypeBadge type={abs.type} />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-[12px] text-stone-400">Mindenki bent van ma.</div>
          )}
        </div>

        {/* open absence requests */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] font-semibold text-stone-800">
              Nyitott kérelmek{openReqs.length ? ` (${openReqs.length})` : ''}
            </span>
            <button onClick={() => onScreen('absences')}
              className="text-[11.5px] text-amber-700 font-medium inline-flex items-center gap-1">
              Mind <Icon name="chevron" size={13} />
            </button>
          </div>
          {openReqs.length > 0 ? (
            <div className="space-y-2">
              {openReqs.map((a) => {
                const emp = EMPLOYEES.find((e) => e.id === a.empId)
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    {emp && <Avatar emp={emp} size={28} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-stone-800 truncate">{emp?.name}</span>
                        <AbsTypeBadge type={a.type} />
                      </div>
                      <div className="text-[10.5px] text-stone-400">{a.start} – {a.end} · {a.days} nap</div>
                    </div>
                    <AbsStatusPill status={a.status} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-[12px] text-stone-400">Nincs nyitott kérelem.</div>
          )}
        </div>
      </div>

      {/* week capacity overview */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-stone-800">Heti kapacitás — áttekintés</span>
          <button onClick={() => onScreen('capacity')}
            className="text-[11.5px] text-amber-700 font-medium inline-flex items-center gap-1">
            Naptár <Icon name="chevron" size={13} />
          </button>
        </div>
        {EMPLOYEES.map((e) => {
          const ws = weekSummary(e, monday)
          return (
            <button key={e.id} onClick={() => setOpenEmp(e)}
              className="w-full text-left px-4 py-2.5 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 flex items-center gap-3">
              <Avatar emp={e} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-stone-900 truncate">{e.name}</div>
                <div className="text-[10.5px] text-stone-400 truncate">{e.role}</div>
              </div>
              <div className="shrink-0 w-[140px] hidden md:block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-stone-400">terhelés</span>
                  <span className="text-[10.5px] tabular-nums text-stone-600">{Math.round(ws.load)}/{Math.round(ws.capacity)}ó</span>
                </div>
                <UtilBar util={ws.util} />
              </div>
              <DeptPill dept={e.dept} size="sm" />
            </button>
          )
        })}
      </div>

      <EmployeeDetailSlideOver emp={openEmp} onClose={() => setOpenEmp(null)} />
    </div>
  )
}

// ── People List ────────────────────────────────────────────────────────────────
function HrPeople() {
  const [openEmp, setOpenEmp] = useState<Employee | null>(null)
  const [deptFilter, setDeptFilter] = useState<HrDeptKey | 'all'>('all')
  const [q, setQ] = useState('')
  const monday = mondayOf(HR_TODAY)

  const filtered = EMPLOYEES
    .filter((e) => deptFilter === 'all' || e.dept === deptFilter)
    .filter((e) => !q.trim() || (e.name + ' ' + e.role).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Dolgozók</h1>
        <span className="text-[12px] text-stone-400">{filtered.length} dolgozó</span>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400">
            <Icon name="search" size={15} />
          </span>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés név / szerep…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-200 text-[12.5px] bg-white outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['all', ...HR_DEPT_ORDER] as const).map((d) => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className={`h-8 px-2.5 rounded-lg text-[11.5px] font-medium shrink-0 border ${
                deptFilter === d ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200'
              }`}>
              {d === 'all' ? 'Összes' : HR_DEPT_META[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filtered.map((e) => {
          const ws = weekSummary(e, monday)
          return (
            <button key={e.id} onClick={() => setOpenEmp(e)}
              className="w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 flex items-center gap-3">
              <Avatar emp={e} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-stone-900 truncate">{e.name}</span>
                  {e.employment === 'part' && (
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 shrink-0">részmunka</span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 truncate">{e.role}</div>
                <div className="hidden sm:flex items-center gap-1.5 mt-1.5">
                  {e.skills.slice(0, 3).map((sk) => <SkillChip key={sk.key} sk={sk} />)}
                </div>
              </div>
              <div className="shrink-0 w-[130px] hidden md:block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-stone-400">heti terhelés</span>
                  <span className="text-[10.5px] tabular-nums text-stone-600">{Math.round(ws.load)}/{Math.round(ws.capacity)} ó</span>
                </div>
                <UtilBar util={ws.util} />
              </div>
              <DeptPill dept={e.dept} size="sm" />
              <Icon name="chevron" size={15} className="text-stone-300 shrink-0" />
            </button>
          )
        })}
        {!filtered.length && (
          <div className="px-4 py-10 text-center text-[12px] text-stone-400">Nincs találat.</div>
        )}
      </div>

      <EmployeeDetailSlideOver emp={openEmp} onClose={() => setOpenEmp(null)} />
    </div>
  )
}

// ── Capacity Calendar ─────────────────────────────────────────────────────────
function HrCapacity() {
  const [openEmp, setOpenEmp] = useState<Employee | null>(null)
  const start = hrParse(HR_TODAY)
  const days: Date[] = []
  for (let i = 0; i < 14; i++) days.push(new Date(start.getTime() + i * HR_DAY_MS))

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1400px] mx-auto">
      <div className="mb-3">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kapacitás-naptár</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">2 hét · napi terhelés · piros = túlterhelt</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[940px]">
            {/* header */}
            <div className="grid border-b border-stone-100 bg-stone-50/60" style={{ gridTemplateColumns: '180px repeat(14, 1fr)' }}>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-stone-400 font-medium">Dolgozó</div>
              {days.map((d, i) => {
                const isToday = hrFmt(d) === HR_TODAY
                const wknd = !isWorkday(d)
                return (
                  <div key={i} className={`px-1 py-2 text-center border-l border-stone-100 ${isToday ? 'bg-amber-50' : wknd ? 'bg-stone-50' : ''}`}>
                    <div className="text-[9px] text-stone-400">{DOW[d.getDay()]}</div>
                    <div className={`text-[10px] font-mono ${isToday ? 'text-amber-700 font-semibold' : 'text-stone-500'}`}>
                      {d.getMonth() + 1}.{d.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* rows */}
            {EMPLOYEES.map((e) => (
              <div key={e.id} className="grid border-b border-stone-100 last:border-0" style={{ gridTemplateColumns: '180px repeat(14, 1fr)' }}>
                <button onClick={() => setOpenEmp(e)}
                  className="px-3 py-2 min-w-0 text-left hover:bg-stone-50/70 flex items-center gap-2">
                  <Avatar emp={e} size={26} />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold text-stone-800 truncate">{e.name}</div>
                    <div className="text-[9.5px] text-stone-400 truncate">{Math.round(dayCapacity(e))} ó/nap</div>
                  </div>
                </button>
                {days.map((d, i) => {
                  const ds = hrFmt(d)
                  const ld = dayLoad(e, ds)
                  const wknd = !isWorkday(d)
                  return (
                    <div key={i} className={`border-l border-stone-100 p-0.5 min-h-[40px] grid place-items-center ${wknd ? 'bg-stone-50/60' : ''}`}>
                      {ld.absence ? (
                        <span className="w-full h-full rounded grid place-items-center text-[8.5px] font-medium bg-teal-50 text-teal-600">táv</span>
                      ) : (!wknd && ld.capacity > 0) ? (
                        <button onClick={() => setOpenEmp(e)}
                          className={`w-full rounded px-1 py-1 grid place-items-center ${
                            ld.over ? 'ring-1 ring-rose-400 bg-rose-50' :
                            ld.load === 0 ? 'bg-stone-50' :
                            ld.load / ld.capacity > 0.85 ? 'bg-amber-50' : 'bg-emerald-50'
                          }`} title={`${ld.load} / ${ld.capacity} ó`}>
                          <span className={`text-[10px] font-semibold tabular-nums ${
                            ld.over ? 'text-rose-600' :
                            ld.load === 0 ? 'text-stone-300' :
                            ld.load / ld.capacity > 0.85 ? 'text-amber-700' : 'text-emerald-700'
                          }`}>{ld.load || '·'}</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-stone-300">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />szabad</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />&gt;85%</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-50 ring-1 ring-rose-400" />túlterhelt</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-50 border border-teal-200" />távollét</span>
      </div>

      <EmployeeDetailSlideOver emp={openEmp} onClose={() => setOpenEmp(null)} />
    </div>
  )
}

// ── Absence List ───────────────────────────────────────────────────────────────
function HrAbsences() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Távollétek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Összes szabadság és táppénz kérelem</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {ABSENCES.map((a) => {
          const emp = EMPLOYEES.find((e) => e.id === a.empId)
          return (
            <div key={a.id} className="px-4 py-3 border-b border-stone-100 last:border-0 flex items-center gap-3">
              {emp && <Avatar emp={emp} size={32} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-stone-900">{emp?.name}</span>
                  <AbsTypeBadge type={a.type} />
                </div>
                <div className="text-[10.5px] text-stone-400">{a.start} – {a.end} · {a.days} munkanap{a.reason ? ' · ' + a.reason : ''}</div>
              </div>
              <AbsStatusPill status={a.status} />
            </div>
          )
        })}
        {!ABSENCES.length && (
          <div className="px-4 py-10 text-center text-[12px] text-stone-400">Nincs rögzített távollét.</div>
        )}
      </div>
    </div>
  )
}

// ── World Page ─────────────────────────────────────────────────────────────────
export function HrWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'people')   return <HrPeople />
    if (currentScreen === 'capacity') return <HrCapacity />
    if (currentScreen === 'absences') return <HrAbsences />
    return <HrDashboard onScreen={(s) => navigate(`/w/hr/${s}`)} />
  }

  return (
    <WorldShell worldKey="hr" screen={currentScreen}
      onScreen={(key) => navigate(`/w/hr/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  EMPLOYEES, ATTENDANCE_TODAY, ATTENDANCE_HISTORY,
  ATTENDANCE_STATUS_META,
  type AttendanceRecord, type AttendanceEmployee, type AttendanceStatus,
} from '../mocks/attendance'

// ── Helpers ────────────────────────────────────────────────────────────────
function AttendanceStatusPill({ status }: { status: AttendanceStatus }) {
  const m = ATTENDANCE_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Employee SlideOver ─────────────────────────────────────────────────────
function EmployeeSlideOver({ employee, onClose }: { employee: AttendanceEmployee | null; onClose: () => void }) {
  if (!employee) return null
  const history5 = ATTENDANCE_HISTORY.filter((r) => r.employee === employee.name).slice(-5)
  const exceptions = history5.filter((r) => r.status === 'late' || r.status === 'absent')

  return (
    <SlideOver open={true} onClose={onClose} title={employee.name} subtitle={`${employee.id} · ${employee.department}`} width={460}>
      <div className="space-y-5 px-5 py-5">
        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Részleg</div>
          <div className="text-[13px] font-medium text-stone-900">{employee.department}</div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">5 napos jelenlét összesítő</div>
          <div className="space-y-1.5">
            {history5.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-50 border border-stone-100">
                <div className="text-[11px] font-mono text-stone-500 w-24 shrink-0">{r.date}</div>
                <div className="flex-1 text-[11.5px] text-stone-700">
                  {r.clockIn ? `${r.clockIn}${r.clockOut ? ` – ${r.clockOut}` : ''}` : '—'}
                  {r.hours ? ` (${r.hours}h)` : ''}
                </div>
                <AttendanceStatusPill status={r.status} />
              </div>
            ))}
          </div>
        </div>

        {exceptions.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Kivételek</div>
            <div className="space-y-1.5">
              {exceptions.map((r) => (
                <div key={r.id} className={`px-3 py-2 rounded-lg border text-[11.5px] ${
                  r.status === 'absent' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  {r.date} — {ATTENDANCE_STATUS_META[r.status].label}
                  {r.note && <span className="text-[11px] ml-2 opacity-75">({r.note})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Today Shift ────────────────────────────────────────────────────────────
function TodayShift() {
  const [selected, setSelected] = useState<AttendanceEmployee | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Mai műszak</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">2026-04-28 · Reggeli műszak</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ATTENDANCE_TODAY.map((rec) => {
          const emp = EMPLOYEES.find((e) => e.name === rec.employee)
          return (
            <button key={rec.id} onClick={() => emp && setSelected(emp)}
              className="text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-sky-200 transition flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 grid place-items-center text-white text-[13px] font-semibold shrink-0">
                {rec.employee.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-stone-900">{rec.employee}</div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">
                  {rec.clockIn ? `Be: ${rec.clockIn}` : '—'}
                  {rec.hours ? ` · ${rec.hours}h` : ''}
                </div>
              </div>
              <AttendanceStatusPill status={rec.status} />
            </button>
          )
        })}
      </div>
      <EmployeeSlideOver employee={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Attendance Table ───────────────────────────────────────────────────────
function AttendanceTable() {
  const dates = ['2026-04-24', '2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28']
  const dayLabels: Record<string, string> = {
    '2026-04-24': 'H 04-24',
    '2026-04-25': 'K 04-25',
    '2026-04-26': 'Sz 04-26',
    '2026-04-27': 'Cs 04-27',
    '2026-04-28': 'P 04-28',
  }

  function getRecord(emp: string, date: string): AttendanceRecord | undefined {
    return ATTENDANCE_HISTORY.find((r) => r.employee === emp && r.date === date)
  }

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Előzmények</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">5 napos jelenlét táblázat</p>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left px-4 py-3 text-[11px] font-medium text-stone-500 w-40">Dolgozó</th>
              {dates.map((d) => (
                <th key={d} className="text-center px-2 py-3 text-[11px] font-medium text-stone-500">{dayLabels[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {EMPLOYEES.map((emp) => (
              <tr key={emp.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-2.5">
                  <div className="text-[12.5px] font-medium text-stone-900">{emp.name}</div>
                  <div className="text-[10.5px] text-stone-400">{emp.department}</div>
                </td>
                {dates.map((d) => {
                  const rec = getRecord(emp.name, d)
                  if (!rec) return <td key={d} className="text-center px-2 py-2.5" />
                  return (
                    <td key={d} className="text-center px-2 py-2.5">
                      <AttendanceStatusPill status={rec.status} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Exceptions Panel ───────────────────────────────────────────────────────
function ExceptionsPanel() {
  const [selected, setSelected] = useState<AttendanceEmployee | null>(null)
  const exceptions = ATTENDANCE_HISTORY.filter((r) => r.status === 'late' || r.status === 'absent')

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kivételek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Késések és hiányzások az elmúlt 5 napban</p>
      </div>
      <div className="space-y-2">
        {exceptions.map((rec) => {
          const emp = EMPLOYEES.find((e) => e.name === rec.employee)
          return (
            <button key={rec.id} onClick={() => emp && setSelected(emp)}
              className={`w-full text-left rounded-xl border px-4 py-3 hover:shadow-sm transition flex items-center gap-3 ${
                rec.status === 'absent' ? 'bg-rose-50/50 border-rose-100 hover:border-rose-300' : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
              }`}>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-stone-900">{rec.employee}</div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">{rec.date}{rec.note && ` · ${rec.note}`}</div>
              </div>
              <AttendanceStatusPill status={rec.status} />
            </button>
          )
        })}
        {exceptions.length === 0 && (
          <div className="py-12 text-center text-[13px] text-stone-400">Nincs kivétel az elmúlt 5 napban.</div>
        )}
      </div>
      <EmployeeSlideOver employee={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Attendance Dashboard ───────────────────────────────────────────────────
function AttendanceDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selected, setSelected] = useState<AttendanceEmployee | null>(null)

  const presentToday  = ATTENDANCE_TODAY.filter((r) => r.status === 'present').length
  const lateToday     = ATTENDANCE_TODAY.filter((r) => r.status === 'late').length
  const absentToday   = ATTENDANCE_TODAY.filter((r) => r.status === 'absent').length
  const avgHours      = (() => {
    const withHours = ATTENDANCE_TODAY.filter((r) => r.hours)
    return withHours.length > 0 ? (withHours.reduce((s, r) => s + (r.hours ?? 0), 0) / withHours.length).toFixed(1) : '—'
  })()

  const KpiCard = ({ label, value, sub, tone, icon }: { label: string; value: string | number; sub: string; tone: string; icon: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg grid place-items-center bg-${tone}-50 text-${tone}-600`}>
          <Icon name={icon} size={16} />
        </div>
        <div className="text-[22px] font-semibold text-stone-900 leading-none">{value}</div>
      </div>
      <div className="text-[12px] font-medium text-stone-700 mt-2.5">{label}</div>
      <div className="text-[10.5px] text-stone-400 mt-0.5">{sub}</div>
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Jelenlét</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Be/kilépések, műszakok, kivételek</p>
        </div>
        <button onClick={() => onScreen('today')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="user" size={15} />Mai műszak
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Ma bent"             value={presentToday} sub="jelenleg a munkahelyen"   tone="emerald" icon="check" />
        <KpiCard label="Késő"                value={lateToday}    sub="késéssel érkezett"         tone="amber"   icon="alert" />
        <KpiCard label="Hiányzó"             value={absentToday}  sub="nem jelent meg"            tone="rose"    icon="x" />
        <KpiCard label="Átlag ledolgozott"   value={`${avgHours}h`} sub="mai munkaidő"            tone="sky"     icon="calendar" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Mai műszak</span>
            <button onClick={() => onScreen('today')} className="text-[11px] text-sky-600 hover:text-sky-800">Részletek →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {ATTENDANCE_TODAY.map((rec) => {
              const emp = EMPLOYEES.find((e) => e.name === rec.employee)
              return (
                <button key={rec.id} onClick={() => emp && setSelected(emp)}
                  className="w-full text-left px-4 py-2.5 hover:bg-stone-50/60 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-stone-900 truncate">{rec.employee}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {rec.clockIn ? `Be: ${rec.clockIn}` : '—'}
                      {rec.hours ? ` · ${rec.hours}h` : ''}
                    </div>
                  </div>
                  <AttendanceStatusPill status={rec.status} />
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Kivételek (5 nap)</span>
            <button onClick={() => onScreen('exceptions')} className="text-[11px] text-sky-600 hover:text-sky-800">Összes →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {ATTENDANCE_HISTORY.filter((r) => r.status === 'late' || r.status === 'absent').slice(0, 5).map((rec) => (
              <div key={rec.id} className={`px-4 py-2.5 flex items-center gap-3 ${
                rec.status === 'absent' ? 'bg-rose-50/30' : 'bg-amber-50/30'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{rec.employee}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{rec.date}{rec.note && ` · ${rec.note}`}</div>
                </div>
                <AttendanceStatusPill status={rec.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <EmployeeSlideOver employee={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Attendance World Page ──────────────────────────────────────────────────
export function AttendanceWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'today')      return <TodayShift />
    if (currentScreen === 'history')    return <AttendanceTable />
    if (currentScreen === 'exceptions') return <ExceptionsPanel />
    return <AttendanceDashboard onScreen={(s) => navigate(`/w/attendance/${s}`)} />
  }

  return (
    <WorldShell worldKey="attendance" screen={currentScreen}
      onScreen={(key) => navigate(`/w/attendance/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

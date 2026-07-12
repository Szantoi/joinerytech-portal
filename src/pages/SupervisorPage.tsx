import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import { useApi, API_BASE } from '../hooks/useApi'
import {
  DAY_PLAN, ALERTS, WS_STATE_META, SUP_TODAY,
  type Workstation, type Alert,
} from '../mocks/supervisor'

// ── Workstation State Pill ─────────────────────────────────────────────────
function WsStatePill({ state }: { state: Workstation['state'] }) {
  const m = WS_STATE_META[state]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium border ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Alert Badge ────────────────────────────────────────────────────────────
function AlertIcon({ kind }: { kind: Alert['kind'] }) {
  const icons: Record<Alert['kind'], string> = { blocked: 'alert', late: 'calendar', material: 'box', quality: 'check' }
  const tones: Record<Alert['kind'], string> = { blocked: 'text-rose-600', late: 'text-orange-600', material: 'text-amber-600', quality: 'text-sky-600' }
  return <Icon name={icons[kind]} size={15} className={tones[kind]} />
}

// ── Workstation Detail SlideOver ───────────────────────────────────────────
function WorkstationDetailSlideOver({ ws, onClose }: { ws: Workstation | null; onClose: () => void }) {
  if (!ws) return null
  const util = Math.round(ws.utilization * 100)

  return (
    <SlideOver open={true} onClose={onClose} title={ws.name} subtitle={ws.department} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <WsStatePill state={ws.state} />
          {ws.operator && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-600">
              <Icon name="user" size={13} />{ws.operator}
            </span>
          )}
        </div>

        {ws.currentTask && (
          <div>
            <div className="text-[10.5px] text-stone-400 mb-1">Aktuális feladat</div>
            <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5 text-[12.5px] text-stone-800">{ws.currentTask}</div>
            {ws.currentOrder && <div className="text-[11px] text-stone-400 mt-1 font-mono">{ws.currentOrder}</div>}
          </div>
        )}

        {ws.blockedReason && (
          <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <Icon name="alert" size={15} className="text-rose-600 mt-0.5 shrink-0" />
            <div className="text-[12px] text-rose-700">{ws.blockedReason}</div>
          </div>
        )}

        <div>
          <div className="text-[10.5px] text-stone-400 mb-1.5">Kihasználtság ma</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-stone-100 rounded-full">
              <div className={`h-2 rounded-full ${util >= 80 ? 'bg-emerald-500' : util >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${util}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-stone-800 tabular-nums w-10 text-right">{util}%</span>
          </div>
          <div className="flex justify-between text-[10.5px] text-stone-400 mt-1">
            <span>Teljesítve: {ws.completedToday} egység</span>
            <span>Terv: {ws.plannedToday} egység</span>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Day Plan SlideOver ─────────────────────────────────────────────────────
function DayPlanSlideOver({ open, onClose }: { open: boolean; onClose: () => void }) {
  const STATUS_TONE: Record<string, string> = {
    done: 'text-emerald-700 bg-emerald-50',
    in_progress: 'text-sky-700 bg-sky-50',
    blocked: 'text-rose-700 bg-rose-50',
    late: 'text-orange-700 bg-orange-50',
    pending: 'text-stone-600 bg-stone-50',
  }
  const STATUS_LABEL: Record<string, string> = {
    done: 'Kész', in_progress: 'Folyamatban', blocked: 'Blokkolt', late: 'Késő', pending: 'Tervezett',
  }
  return (
    <SlideOver open={open} onClose={onClose} title="Napi terv" subtitle={SUP_TODAY} width={560}>
      <div className="px-5 py-4 space-y-2">
        {DAY_PLAN.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-stone-900 truncate">{item.product}</div>
              <div className="text-[11px] text-stone-500 mt-0.5 truncate">{item.customer} · {item.workstation}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11.5px] tabular-nums text-stone-700 font-medium">{item.doneQty}/{item.qty}</div>
              <span className={`inline-flex items-center px-1.5 h-5 rounded-full text-[9.5px] font-medium mt-0.5 ${STATUS_TONE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SlideOver>
  )
}

// ── Floor View ─────────────────────────────────────────────────────────────
function FloorView() {
  const [selected, setSelected] = useState<Workstation | null>(null)
  const { data: apiWorkstations, refetch } = useApi<Workstation[]>(`${API_BASE.kernel}/tools/workstations`)
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const workstations: Workstation[] = apiWorkstations ?? []

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Műhely-floor</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Munkaállomások élő státusza · {SUP_TODAY}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workstations.map((ws) => (
          <button key={ws.id} onClick={() => setSelected(ws)}
            className="text-left bg-white rounded-xl border border-stone-200 p-4 hover:shadow-sm hover:border-rose-200 transition">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="text-[13px] font-semibold text-stone-900">{ws.name}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{ws.department}</div>
              </div>
              <WsStatePill state={ws.state} />
            </div>
            {ws.operator && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-stone-600 mb-2">
                <Icon name="user" size={12} />{ws.operator}
              </div>
            )}
            {ws.currentTask && (
              <div className="text-[11px] text-stone-500 truncate mb-2">{ws.currentTask}</div>
            )}
            {ws.blockedReason && (
              <div className="text-[11px] text-rose-600 truncate mb-2 flex items-center gap-1">
                <Icon name="alert" size={11} />{ws.blockedReason}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full">
                <div className={`h-1.5 rounded-full ${ws.utilization >= 0.8 ? 'bg-emerald-500' : ws.utilization >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(ws.utilization * 100)}%` }} />
              </div>
              <span className="text-[11px] text-stone-500 tabular-nums">{Math.round(ws.utilization * 100)}%</span>
            </div>
          </button>
        ))}
      </div>

      <WorkstationDetailSlideOver ws={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Day Plan Page ──────────────────────────────────────────────────────────
function DayPlanPage() {
  const done = DAY_PLAN.filter((i) => i.status === 'done').length
  const total = DAY_PLAN.length
  const inProg = DAY_PLAN.filter((i) => i.status === 'in_progress').length
  const blocked = DAY_PLAN.filter((i) => i.status === 'blocked').length
  const late = DAY_PLAN.filter((i) => i.status === 'late').length

  const STATUS_TONE: Record<string, string> = {
    done: 'bg-emerald-50 text-emerald-700', in_progress: 'bg-sky-50 text-sky-700',
    blocked: 'bg-rose-50 text-rose-700', late: 'bg-orange-50 text-orange-700', pending: 'bg-stone-50 text-stone-600',
  }
  const STATUS_LABEL: Record<string, string> = {
    done: 'Kész', in_progress: 'Folyamatban', blocked: 'Blokkolt', late: 'Késő', pending: 'Tervezett',
  }

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1100px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Napi terv</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">{SUP_TODAY} · {done}/{total} teljesítve · {inProg} folyamatban · {blocked} blokkolt · {late} késő</p>
      </div>

      <div className="w-full h-2 bg-stone-100 rounded-full mb-5">
        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${Math.round(done / total * 100)}%` }} />
      </div>

      <div className="space-y-2">
        {DAY_PLAN.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900 truncate">{item.product}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{item.customer} · {item.order}</div>
              <div className="text-[11px] text-stone-400 mt-0.5">{item.workstation}</div>
            </div>
            <div className="shrink-0 text-right space-y-1">
              <div className="text-[13px] font-bold tabular-nums text-stone-800">{item.doneQty}<span className="text-stone-400 font-normal">/{item.qty}</span></div>
              <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${STATUS_TONE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Supervisor Dashboard ───────────────────────────────────────────────────
function SupervisorDashboard() {
  const [selected, setSelected] = useState<Workstation | null>(null)
  const [dayPlanOpen, setDayPlanOpen] = useState(false)
  const { data: apiWorkstations, refetch } = useApi<Workstation[]>(`${API_BASE.kernel}/tools/workstations`)
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const workstations: Workstation[] = apiWorkstations ?? []

  const working = workstations.filter((w) => w.state === 'working').length
  const blocked = workstations.filter((w) => w.state === 'blocked').length
  const totalPlanned = DAY_PLAN.reduce((s, i) => s + i.qty, 0)
  const totalDone    = DAY_PLAN.reduce((s, i) => s + i.doneQty, 0)
  const alertCount   = ALERTS.filter((a) => a.severity === 'high').length

  const KpiCard = ({ label, value, sub, tone, icon }: { label: string; value: string | number; sub: string; tone: string; icon: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg grid place-items-center bg-${tone}-50 text-${tone}-600`}>
          <Icon name={icon} size={16} />
        </div>
        <div className="text-[22px] font-semibold text-stone-900 leading-none tabular-nums">{value}</div>
      </div>
      <div className="text-[12px] font-medium text-stone-700 mt-2.5">{label}</div>
      <div className="text-[10.5px] text-stone-400 mt-0.5">{sub}</div>
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Műszakvezető</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Élő műhely monitor · {SUP_TODAY}</p>
        </div>
        <button onClick={() => setDayPlanOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="clipboard" size={15} />Napi terv
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Dolgozik" value={working} sub={`${workstations.length} állomásból`} tone="emerald" icon="production" />
        <KpiCard label="Blokkolt" value={blocked} sub="azonnali beavatkozás" tone="rose" icon="alert" />
        <KpiCard label="Napi terv" value={`${totalDone}/${totalPlanned}`} sub="egység teljesítve" tone="sky" icon="analytics" />
        <KpiCard label="Magas prioritású riasztás" value={alertCount} sub="azonnali figyelmet igényel" tone="orange" icon="bell" />
      </div>

      {/* Alert panel */}
      {ALERTS.length > 0 && (
        <div className="mb-5 space-y-2">
          {ALERTS.map((a) => (
            <div key={a.id} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${a.severity === 'high' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
              <AlertIcon kind={a.kind} />
              <div className="min-w-0 flex-1">
                <div className={`text-[12.5px] font-semibold ${a.severity === 'high' ? 'text-rose-800' : 'text-amber-800'}`}>{a.message}</div>
                {(a.workstation || a.order) && (
                  <div className={`text-[11px] mt-0.5 ${a.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {a.workstation && <span>{a.workstation}</span>}
                    {a.order && <span className="ml-2 font-mono">{a.order}</span>}
                  </div>
                )}
              </div>
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {a.severity === 'high' ? 'Magas' : 'Közepes'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Workstations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workstations.map((ws) => (
          <button key={ws.id} onClick={() => setSelected(ws)}
            className="text-left bg-white rounded-xl border border-stone-200 p-3 hover:shadow-sm hover:border-rose-200 transition">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="text-[12.5px] font-semibold text-stone-900 truncate">{ws.name}</div>
              <WsStatePill state={ws.state} />
            </div>
            {ws.operator && <div className="text-[11px] text-stone-500 mb-1">{ws.operator}</div>}
            {ws.currentTask && <div className="text-[10.5px] text-stone-500 truncate">{ws.currentTask}</div>}
            {ws.blockedReason && <div className="text-[10.5px] text-rose-600 truncate flex items-center gap-1 mt-1"><Icon name="alert" size={10} />{ws.blockedReason}</div>}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-stone-100 rounded-full">
                <div className={`h-1 rounded-full ${ws.utilization >= 0.8 ? 'bg-emerald-500' : ws.utilization >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(ws.utilization * 100)}%` }} />
              </div>
              <span className="text-[10px] text-stone-400">{Math.round(ws.utilization * 100)}%</span>
            </div>
          </button>
        ))}
      </div>

      <WorkstationDetailSlideOver ws={selected} onClose={() => setSelected(null)} />
      <DayPlanSlideOver open={dayPlanOpen} onClose={() => setDayPlanOpen(false)} />
    </div>
  )
}

// ── Supervisor World Page ──────────────────────────────────────────────────
export function SupervisorWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'floor')   return <FloorView />
    if (currentScreen === 'dayplan') return <DayPlanPage />
    return <SupervisorDashboard />
  }

  return (
    <WorldShell worldKey="supervisor" screen={currentScreen}
      onScreen={(key) => navigate(`/w/supervisor/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  INCIDENTS, RISKS, ACTIONS,
  INCIDENT_TYPE_META, INCIDENT_SEVERITY_META, INCIDENT_STATUS_META, RISK_LEVEL_META,
  type EhsIncident, type EhsRisk,
  type IncidentType, type IncidentSeverity, type IncidentStatus, type RiskLevel,
} from '../mocks/ehs'

// ── Helpers ────────────────────────────────────────────────────────────────
function IncidentTypeBadge({ type }: { type: IncidentType }) {
  const m = INCIDENT_TYPE_META[type]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

function SeverityPill({ severity }: { severity: IncidentSeverity }) {
  const m = INCIDENT_SEVERITY_META[severity]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function IncidentStatusPill({ status }: { status: IncidentStatus }) {
  const m = INCIDENT_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const m = RISK_LEVEL_META[level]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

// ── Incident Detail SlideOver ──────────────────────────────────────────────
function IncidentDetailSlideOver({ incident, onClose }: { incident: EhsIncident | null; onClose: () => void }) {
  if (!incident) return null
  return (
    <SlideOver open={true} onClose={onClose} title={incident.title} subtitle={`${incident.id} · ${incident.location}`} width={520}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          <IncidentTypeBadge type={incident.type} />
          <SeverityPill severity={incident.severity} />
          <IncidentStatusPill status={incident.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Dátum</div>
            <div className="text-[12px] font-mono text-stone-800">{incident.date}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Bejelentette</div>
            <div className="text-[12px] text-stone-800">{incident.reportedBy}</div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Helyszín</div>
          <div className="text-[12px] text-stone-800">{incident.location}</div>
        </div>

        {incident.persons.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Érintett személyek</div>
            <div className="flex flex-wrap gap-1.5">
              {incident.persons.map((p, i) => (
                <span key={i} className="px-2.5 h-7 rounded-lg bg-stone-100 text-stone-700 text-[11.5px] font-medium inline-flex items-center">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[10.5px] text-stone-400 mb-1">Leírás</div>
          <div className="text-[12.5px] text-stone-800">{incident.description}</div>
        </div>

        {incident.investigationNote && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11.5px] text-amber-700">
            <Icon name="alert" size={12} className="inline mr-1" />
            {incident.investigationNote}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Risk Matrix ────────────────────────────────────────────────────────────
function RiskMatrix() {
  const [selected, setSelected] = useState<EhsRisk | null>(null)

  // 3×3 matrix cell color based on probability × impact
  function cellColor(prob: number, impact: number) {
    const score = prob * impact
    if (score >= 6) return 'bg-rose-100 border-rose-200'
    if (score >= 3) return 'bg-amber-50 border-amber-200'
    return 'bg-emerald-50 border-emerald-200'
  }

  function getRisksAt(prob: number, impact: number) {
    return RISKS.filter((r) => r.probability === prob && r.impact === impact)
  }

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kockázatok</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">3×3 kockázati mátrix — valószínűség × hatás</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5 overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="flex mb-1">
            <div className="w-24 shrink-0" />
            {[1, 2, 3].map((impact) => (
              <div key={impact} className="flex-1 text-center text-[10.5px] text-stone-500 pb-1">
                Hatás {impact}
              </div>
            ))}
          </div>
          {([3, 2, 1] as const).map((prob) => (
            <div key={prob} className="flex gap-1 mb-1">
              <div className="w-24 shrink-0 flex items-center text-[10.5px] text-stone-500 pr-2">
                Val. {prob}
              </div>
              {([1, 2, 3] as const).map((impact) => {
                const cellRisks = getRisksAt(prob, impact)
                return (
                  <div key={impact} className={`flex-1 min-h-[80px] rounded-lg border p-2 ${cellColor(prob, impact)}`}>
                    {cellRisks.map((r) => (
                      <button key={r.id} onClick={() => setSelected(r)}
                        className="w-full text-left text-[10px] text-stone-700 hover:text-stone-900 mb-1 leading-tight">
                        {r.title}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {RISKS.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-rose-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900">{r.title}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{r.area} · Felelős: {r.owner}</div>
              <div className="text-[11px] text-stone-400 mt-1">Val. {r.probability} × Hatás {r.impact} · Felülvizsgálat: {r.lastReview}</div>
            </div>
            <RiskLevelBadge level={r.level} />
          </button>
        ))}
      </div>

      {selected && (
        <SlideOver open={true} onClose={() => setSelected(null)} title={selected.title} subtitle={`${selected.id} · ${selected.area}`} width={420}>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-2">
              <RiskLevelBadge level={selected.level} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10.5px] text-stone-400 mb-0.5">Valószínűség</div>
                <div className="text-[14px] font-bold text-stone-900">{selected.probability} / 3</div>
              </div>
              <div>
                <div className="text-[10.5px] text-stone-400 mb-0.5">Hatás</div>
                <div className="text-[14px] font-bold text-stone-900">{selected.impact} / 3</div>
              </div>
              <div>
                <div className="text-[10.5px] text-stone-400 mb-0.5">Terület</div>
                <div className="text-[12px] text-stone-800">{selected.area}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-stone-400 mb-0.5">Felelős</div>
                <div className="text-[12px] text-stone-800">{selected.owner}</div>
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-stone-400 mb-0.5">Utolsó felülvizsgálat</div>
              <div className="text-[12px] font-mono text-stone-800">{selected.lastReview}</div>
            </div>
          </div>
        </SlideOver>
      )}
    </div>
  )
}

// ── Incident List ──────────────────────────────────────────────────────────
function IncidentList() {
  const [selected, setSelected] = useState<EhsIncident | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Események</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Balesetek, közel-miss esetek, környezeti események</p>
      </div>
      <div className="space-y-2">
        {INCIDENTS.map((inc) => (
          <button key={inc.id} onClick={() => setSelected(inc)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-rose-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <IncidentTypeBadge type={inc.type} />
                <SeverityPill severity={inc.severity} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{inc.title}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{inc.location} · {inc.reportedBy}</div>
              <div className="text-[11px] text-stone-400 mt-1 font-mono">{inc.date}</div>
            </div>
            <IncidentStatusPill status={inc.status} />
          </button>
        ))}
      </div>
      <IncidentDetailSlideOver incident={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Actions List ───────────────────────────────────────────────────────────
function ActionsList() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Intézkedések</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">EHS intézkedések és feladatok</p>
      </div>
      <div className="space-y-2">
        {ACTIONS.map((action) => {
          const isDone = done[action.id] ?? action.done
          return (
            <div key={action.id}
              className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${isDone ? 'border-emerald-100 opacity-70' : 'border-stone-200'}`}>
              <button
                onClick={() => setDone((prev) => ({ ...prev, [action.id]: !isDone }))}
                className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition ${
                  isDone ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-emerald-400'
                }`}>
                {isDone && <Icon name="check" size={10} className="text-white" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] font-medium ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                  {action.title}
                </div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">
                  {action.assignee} · Határidő: {action.dueDate}
                </div>
              </div>
              <div className="shrink-0">
                <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${
                  action.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                  action.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'
                }`}>
                  {action.priority === 'high' ? 'Magas' : action.priority === 'medium' ? 'Közepes' : 'Alacsony'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── EHS Dashboard ──────────────────────────────────────────────────────────
function EhsDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selected, setSelected] = useState<EhsIncident | null>(null)

  const openActions    = ACTIONS.filter((a) => !a.done).length
  const criticalRisks  = RISKS.filter((r) => r.level === 'critical' || r.level === 'high').length
  const incidentYtd    = INCIDENTS.length
  const incidentFree   = 3 // demo days since last incident

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
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">EHS</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Munkavédelem, balesetek, kockázatok</p>
        </div>
        <button onClick={() => onScreen('incidents')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="alert" size={15} />Események
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Esemény YTD"         value={incidentYtd}     sub="összesen idén"       tone="rose"    icon="alert" />
        <KpiCard label="Nyitott intézkedés"  value={openActions}     sub="teljesítés szükséges" tone="amber"  icon="clipboard" />
        <KpiCard label="Magas kockázat"      value={criticalRisks}   sub="kockázati terület"   tone="rose"    icon="alert" />
        <KpiCard label="Baleset-mentes nap"  value={incidentFree}    sub="napja nincs baleset"  tone="emerald" icon="check" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi események</span>
            <button onClick={() => onScreen('incidents')} className="text-[11px] text-rose-600 hover:text-rose-800">Összes →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {INCIDENTS.map((inc) => (
              <button key={inc.id} onClick={() => setSelected(inc)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{inc.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{inc.date} · {inc.location}</div>
                </div>
                <SeverityPill severity={inc.severity} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Kockázati mátrix (kivonat)</span>
            <button onClick={() => onScreen('risks')} className="text-[11px] text-rose-600 hover:text-rose-800">Mátrix →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {RISKS.filter((r) => r.level === 'critical' || r.level === 'high').map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{r.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{r.area} · Val. {r.probability} × Hatás {r.impact}</div>
                </div>
                <RiskLevelBadge level={r.level} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <IncidentDetailSlideOver incident={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── EHS World Page ─────────────────────────────────────────────────────────
export function EhsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'incidents') return <IncidentList />
    if (currentScreen === 'risks')     return <RiskMatrix />
    if (currentScreen === 'actions')   return <ActionsList />
    return <EhsDashboard onScreen={(s) => navigate(`/w/ehs/${s}`)} />
  }

  return (
    <WorldShell worldKey="ehs" screen={currentScreen}
      onScreen={(key) => navigate(`/w/ehs/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

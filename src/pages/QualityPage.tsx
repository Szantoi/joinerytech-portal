import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  NCR_STATUS_META, NCR_SEVERITY_META, AUDIT_RESULT_META,
  type QualityNcr, type NcrStatus, type NcrSeverity, type AuditResult,
} from '../mocks/quality'

function EndpointPending({ endpoint }: { endpoint: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 flex flex-col items-center gap-2 text-center">
      <div className="text-[13px] font-semibold text-amber-700">Backend endpoint nem elérhető</div>
      <code className="text-[11px] text-amber-600 bg-amber-100 rounded px-2 py-0.5">{endpoint}</code>
      <div className="text-[11px] text-stone-500 mt-1">Az endpoint implementálása után lesz élő adat</div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function NcrStatusPill({ status }: { status: NcrStatus }) {
  const m = NCR_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function NcrSeverityBadge({ severity }: { severity: NcrSeverity }) {
  const m = NCR_SEVERITY_META[severity]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

function AuditResultBadge({ result }: { result: AuditResult }) {
  const m = AUDIT_RESULT_META[result]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── NCR Detail SlideOver ───────────────────────────────────────────────────
function NcrDetailSlideOver({ ncr, onClose }: { ncr: QualityNcr | null; onClose: () => void }) {
  const [status, setStatus] = useState<NcrStatus | null>(null)
  if (!ncr) return null
  const currentStatus = status ?? ncr.status

  return (
    <SlideOver open={true} onClose={onClose} title={ncr.title} subtitle={`${ncr.id} · ${ncr.product}`} width={520}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <NcrSeverityBadge severity={ncr.severity} />
          <NcrStatusPill status={currentStatus} />
          <span className="text-[11.5px] text-stone-500">{ncr.reportedBy} · {ncr.reportedAt}</span>
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-1">Leírás</div>
          <div className="text-[12.5px] text-stone-800">{ncr.description}</div>
        </div>

        {ncr.fixPlan && (
          <div>
            <div className="text-[10.5px] text-stone-400 mb-1">Javítási terv</div>
            <div className="text-[12.5px] text-stone-800">{ncr.fixPlan}</div>
          </div>
        )}

        {ncr.closedAt && (
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Lezárva</div>
            <div className="text-[12px] font-mono text-stone-800">{ncr.closedAt}</div>
          </div>
        )}

        <div className="pt-2 border-t border-stone-100">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Állapot változtatás</div>
          <div className="flex flex-wrap gap-2">
            {currentStatus === 'open' && (
              <button onClick={() => setStatus('under_review')}
                className="h-9 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-medium">
                Vizsgálat indítása
              </button>
            )}
            {currentStatus === 'under_review' && (
              <button onClick={() => setStatus('closed')}
                className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-medium">
                Lezárás
              </button>
            )}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── NCR List ───────────────────────────────────────────────────────────────
function NcrList() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">NCR-ek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Nem-megfelelőségi rekordok</p>
      </div>
      <EndpointPending endpoint="GET /quality/api/ncrs [?]" />
    </div>
  )
}

// ── Templates List ─────────────────────────────────────────────────────────
function TemplatesList() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Sablonok</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Minőség-ellenőrzési ellenőrzőlisták</p>
      </div>
      <EndpointPending endpoint="GET /quality/api/templates [?]" />
    </div>
  )
}

// ── Audit Log ──────────────────────────────────────────────────────────────
function AuditLog() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Auditok</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Minőség-ellenőrzési audit napló</p>
      </div>
      <EndpointPending endpoint="GET /quality/api/audits [?]" />
    </div>
  )
}

// ── Quality Dashboard ──────────────────────────────────────────────────────
function QualityDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const openNcrs    = 0
  const avgClose    = 0
  const passRate    = 0
  const activeAudits = 0

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
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Minőség</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">NCR-ek, ellenőrzőlisták, auditok</p>
        </div>
        <button onClick={() => onScreen('ncr')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="check" size={15} />NCR-ek
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Nyitott NCR"     value={openNcrs}          sub="kezelés szükséges" tone="rose"    icon="alert" />
        <KpiCard label="Átlagos zárás"   value={`${avgClose} nap`} sub="napokban"          tone="amber"   icon="calendar" />
        <KpiCard label="Pass rate"       value={`${passRate}%`}    sub="átlagos megfelelés" tone="emerald" icon="check" />
        <KpiCard label="Aktív auditok"   value={activeAudits}      sub="audit bejegyzés"   tone="sky"     icon="clipboard" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Nyitott NCR-ek</span>
            <button onClick={() => onScreen('ncr')} className="text-[11px] text-emerald-600 hover:text-emerald-800">Összes →</button>
          </div>
          <div className="px-4 py-4 text-center text-[12px] text-stone-400">
            Adatok nem elérhetők · endpoint fejlesztés alatt
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi auditok</span>
            <button onClick={() => onScreen('audits')} className="text-[11px] text-emerald-600 hover:text-emerald-800">Összes →</button>
          </div>
          <div className="px-4 py-4 text-center text-[12px] text-stone-400">
            Adatok nem elérhetők · endpoint fejlesztés alatt
          </div>
        </Card>
      </div>

    </div>
  )
}

// ── Quality World Page ─────────────────────────────────────────────────────
export function QualityWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'ncr')       return <NcrList />
    if (currentScreen === 'templates') return <TemplatesList />
    if (currentScreen === 'audits')    return <AuditLog />
    return <QualityDashboard onScreen={(s) => navigate(`/w/quality/${s}`)} />
  }

  return (
    <WorldShell worldKey="quality" screen={currentScreen}
      onScreen={(key) => navigate(`/w/quality/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

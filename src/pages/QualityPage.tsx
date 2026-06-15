import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  NCRS, TEMPLATES, AUDITS,
  NCR_STATUS_META, NCR_SEVERITY_META, AUDIT_RESULT_META,
  type QualityNcr, type NcrStatus, type NcrSeverity, type AuditResult,
} from '../mocks/quality'

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
  const [selected, setSelected] = useState<QualityNcr | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">NCR-ek</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Nem-megfelelőségi rekordok</p>
      </div>
      <div className="space-y-2">
        {NCRS.map((ncr) => (
          <button key={ncr.id} onClick={() => setSelected(ncr)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-emerald-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <NcrSeverityBadge severity={ncr.severity} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{ncr.title}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{ncr.product} · {ncr.reportedBy}</div>
              <div className="text-[11px] text-stone-400 mt-1 font-mono">{ncr.reportedAt}</div>
            </div>
            <NcrStatusPill status={ncr.status} />
          </button>
        ))}
      </div>
      <NcrDetailSlideOver ncr={selected} onClose={() => setSelected(null)} />
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
      <div className="space-y-3">
        {TEMPLATES.map((tmpl) => (
          <div key={tmpl.id} className="bg-white rounded-xl border border-stone-200 px-4 py-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[13px] font-semibold text-stone-900">{tmpl.name}</div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">{tmpl.productType} · {tmpl.items.length} elem · {tmpl.usedCount}× használt</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tmpl.items.map((item, i) => (
                <span key={i} className="px-2 h-6 rounded-md bg-stone-100 text-stone-600 text-[11px] inline-flex items-center">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
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
      <div className="space-y-2">
        {AUDITS.map((audit) => (
          <div key={audit.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900">{audit.product}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{audit.inspector} · {audit.date}</div>
              <div className="text-[11px] text-stone-400 mt-1">Megfelelési arány: {audit.passRate}% · {audit.findings} megállapítás</div>
            </div>
            <AuditResultBadge result={audit.result} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Quality Dashboard ──────────────────────────────────────────────────────
function QualityDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selected, setSelected] = useState<QualityNcr | null>(null)

  const openNcrs    = NCRS.filter((n) => n.status === 'open' || n.status === 'under_review').length
  const closedNcrs  = NCRS.filter((n) => n.status === 'closed')
  const avgClose    = closedNcrs.length > 0 ? 8 : 0 // demo value in days
  const passAudits  = AUDITS.filter((a) => a.result === 'pass').length
  const passRate    = Math.round((passAudits / AUDITS.length) * 100)
  const activeAudits = AUDITS.filter((a) => a.result !== 'fail').length

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
          <div className="divide-y divide-stone-50">
            {NCRS.filter((n) => n.status === 'open' || n.status === 'under_review').map((ncr) => (
              <button key={ncr.id} onClick={() => setSelected(ncr)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{ncr.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{ncr.product}</div>
                </div>
                <NcrSeverityBadge severity={ncr.severity} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi auditok</span>
            <button onClick={() => onScreen('audits')} className="text-[11px] text-emerald-600 hover:text-emerald-800">Összes →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {AUDITS.slice(0, 4).map((audit) => (
              <div key={audit.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{audit.product}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{audit.inspector} · {audit.date}</div>
                </div>
                <AuditResultBadge result={audit.result} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <NcrDetailSlideOver ncr={selected} onClose={() => setSelected(null)} />
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

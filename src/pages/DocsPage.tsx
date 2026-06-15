import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import { DOCS, DOC_TYPE_META, DOC_STATUS_META, type Doc, type DocStatus } from '../mocks/docs'

// ── Helpers ────────────────────────────────────────────────────────────────
function DocTypeBadge({ type }: { type: Doc['type'] }) {
  const m = DOC_TYPE_META[type]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium border ${m.pill}`}>
      {m.label}
    </span>
  )
}

function DocStatusPill({ status }: { status: DocStatus }) {
  const m = DOC_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium border ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Doc Detail SlideOver ───────────────────────────────────────────────────
function DocDetailSlideOver({ doc, onClose }: { doc: Doc | null; onClose: () => void }) {
  if (!doc) return null
  return (
    <SlideOver open={true} onClose={onClose} title={doc.name} subtitle={`${doc.id} · ${doc.owner}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          <DocTypeBadge type={doc.type} />
          <DocStatusPill status={doc.status} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Verzió</div>
            <div className="text-[12px] font-mono text-stone-800">v{doc.version}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Frissítve</div>
            <div className="text-[12px] font-mono text-stone-800">{doc.updatedAt}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Felelős</div>
            <div className="text-[12px] text-stone-800">{doc.owner}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Kapcsolat</div>
            <div className="text-[12px] text-stone-800">{doc.linkLabel}</div>
          </div>
        </div>

        {doc.note && (
          <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11.5px] text-stone-600">
            {doc.note}
          </div>
        )}

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
            Verziótörténet ({doc.history.length})
          </div>
          <div className="space-y-2">
            {doc.history.map((h) => (
              <div key={h.v} className="border border-stone-100 rounded-lg px-3 py-2 bg-stone-50">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-stone-800">v{h.v}</span>
                  <span className="text-[10.5px] text-stone-400 font-mono">{h.at}</span>
                </div>
                <div className="text-[11.5px] text-stone-600">{h.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Docs List ──────────────────────────────────────────────────────────────
function DocsList() {
  const [selected, setSelected] = useState<Doc | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Dokumentumok</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Verziózott dokumentum-regiszter</p>
      </div>
      <div className="space-y-2">
        {DOCS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelected(doc)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-amber-200 transition flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <DocTypeBadge type={doc.type} />
                <DocStatusPill status={doc.status} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{doc.name}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">
                v{doc.version} · {doc.owner} · {doc.updatedAt}
              </div>
            </div>
          </button>
        ))}
      </div>
      <DocDetailSlideOver doc={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Docs Dashboard ─────────────────────────────────────────────────────────
function DocsDashboard() {
  const [selected, setSelected] = useState<Doc | null>(null)

  const osszes     = DOCS.length
  const feltoltve  = DOCS.filter((d) => d.updatedAt >= '2026-04-22').length
  const kiadott    = DOCS.filter((d) => d.status === 'kiadott').length
  const ellenorzes = DOCS.filter((d) => d.status === 'ellenorzes').length

  const KpiCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className={`text-[22px] font-semibold text-${tone}-700 leading-none`}>{value}</div>
      <div className="text-[12px] font-medium text-stone-700 mt-2">{label}</div>
    </div>
  )

  const recentDocs = [...DOCS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Dokumentumtár</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Verziózott dokumentumok áttekintése</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Összes dokumentum"       value={osszes}     tone="stone" />
        <KpiCard label="Ezen a héten feltöltve"  value={feltoltve}  tone="sky" />
        <KpiCard label="Kiadott"                 value={kiadott}    tone="emerald" />
        <KpiCard label="Ellenőrzés alatt"        value={ellenorzes} tone="amber" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi dokumentumok</span>
        </div>
        <div className="divide-y divide-stone-50">
          {recentDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelected(doc)}
              className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-stone-900 truncate">{doc.name}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">v{doc.version} · {doc.owner}</div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <DocTypeBadge type={doc.type} />
                <DocStatusPill status={doc.status} />
              </div>
            </button>
          ))}
        </div>
      </Card>
      <DocDetailSlideOver doc={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Docs World Page ────────────────────────────────────────────────────────
export function DocsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'files') return <DocsList />
    return <DocsDashboard />
  }

  return (
    <WorldShell
      worldKey="docs"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/docs/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

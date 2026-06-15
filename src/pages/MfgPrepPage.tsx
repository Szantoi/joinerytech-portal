import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  RELEASE_ITEMS, DATASHEETS, RELEASE_STATUS_META, DATASHEET_STATUS_META,
  type ReleaseItem, type MfgDatasheet, type ReleaseStatus,
} from '../mocks/mfgprep'

// ── Helpers ────────────────────────────────────────────────────────────────
function ReleaseStatusPill({ status }: { status: ReleaseStatus }) {
  const m = RELEASE_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function PriorityBadge({ p }: { p: 'high' | 'medium' | 'low' }) {
  const m = { high: 'bg-rose-50 text-rose-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-stone-100 text-stone-600' }
  const l = { high: 'Sürgős', medium: 'Közepes', low: 'Alacsony' }
  return <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m[p]}`}>{l[p]}</span>
}

// ── Release Detail SlideOver ───────────────────────────────────────────────
function ReleaseDetailSlideOver({ item, onClose }: { item: ReleaseItem | null; onClose: () => void }) {
  if (!item) return null
  const done = item.checklist.filter((c) => c.done).length
  const total = item.checklist.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <SlideOver open={true} onClose={onClose} title={item.project} subtitle={`${item.id} · ${item.customer}`} width={520}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <ReleaseStatusPill status={item.status} />
          <PriorityBadge p={item.priority} />
          <span className="text-[11.5px] text-stone-500 inline-flex items-center gap-1">
            <Icon name="calendar" size={13} />Határidő: <span className="font-mono ml-1">{item.dueDate}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Termékek száma</div>
            <div className="text-[14px] font-bold text-stone-900">{item.productCount} db</div>
          </div>
          {item.assignedTo && (
            <div>
              <div className="text-[10.5px] text-stone-400 mb-0.5">Felelős csapat</div>
              <div className="text-[12px] text-stone-800">{item.assignedTo}</div>
            </div>
          )}
        </div>

        {item.materialNote && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11.5px] text-amber-700">
            <Icon name="alert" size={12} className="inline mr-1" />{item.materialNote}
          </div>
        )}

        {/* Ellenőrzőlista */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Ellenőrzőlista</div>
            <div className="text-[11px] text-stone-500">{done}/{total} — {pct}%</div>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full mb-3">
            <div className="h-1.5 bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-1.5">
            {item.checklist.map((c, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12px] ${c.done ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-stone-50 border-stone-100 text-stone-600'}`}>
                <div className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${c.done ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
                  {c.done && <Icon name="check" size={10} className="text-white" />}
                </div>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Jóváhagyás */}
        {item.status === 'pending' && (
          <div className="pt-2 border-t border-stone-100">
            <button className="w-full h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[13px] font-medium">
              Kiadás jóváhagyása
            </button>
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Datasheet SlideOver ────────────────────────────────────────────────────
function DatasheetSlideOver({ ds, onClose }: { ds: MfgDatasheet | null; onClose: () => void }) {
  if (!ds) return null
  const m = DATASHEET_STATUS_META[ds.status]
  const OP_LABELS: Record<string, string> = {
    cutting: 'Szabászat', edge: 'Élzárás', cnc: 'CNC', assembly: 'Összszerelés', surface: 'Felületkezelés', qc: 'QC',
  }
  return (
    <SlideOver open={true} onClose={onClose} title={ds.customer} subtitle={`${ds.id} · ${ds.team}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
          </span>
          <span className="text-[11.5px] text-stone-500">{ds.productCount} termék</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Kezdés</div>
            <div className="text-[12px] font-mono text-stone-800">{ds.startDate}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Határidő</div>
            <div className="text-[12px] font-mono text-stone-800">{ds.dueDate}</div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Műveletek</div>
          <div className="flex flex-wrap gap-1.5">
            {ds.operations.map((op) => (
              <span key={op} className="px-2.5 h-7 rounded-lg bg-stone-100 text-stone-700 text-[11.5px] font-medium inline-flex items-center">
                {OP_LABELS[op] ?? op}
              </span>
            ))}
          </div>
        </div>

        {ds.note && (
          <div className="text-[11.5px] text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">{ds.note}</div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Release Queue ──────────────────────────────────────────────────────────
function ReleaseQueue() {
  const [selected, setSelected] = useState<ReleaseItem | null>(null)
  const [filter, setFilter] = useState<ReleaseStatus | 'all'>('all')

  const STATUS_FILTERS: Array<{ k: ReleaseStatus | 'all'; l: string }> = [
    { k: 'all', l: 'Összes' },
    { k: 'pending', l: 'Kiadásra vár' },
    { k: 'approved', l: 'Jóváhagyva' },
    { k: 'in_production', l: 'Gyártásban' },
    { k: 'ready', l: 'Kész' },
    { k: 'blocked', l: 'Blokkolt' },
  ]
  const rows = filter === 'all' ? RELEASE_ITEMS : RELEASE_ITEMS.filter((r) => r.status === filter)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Release queue</h1>
      </div>

      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium border whitespace-nowrap ${filter === f.k ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((item) => (
          <button key={item.id} onClick={() => setSelected(item)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-orange-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-stone-900 truncate">{item.project}</span>
                <PriorityBadge p={item.priority} />
              </div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{item.customer} · {item.orderId}</div>
              <div className="text-[11px] text-stone-400 mt-1 inline-flex items-center gap-1">
                <Icon name="calendar" size={11} />{item.dueDate} · {item.productCount} termék
                {item.assignedTo && <span className="ml-2">· {item.assignedTo}</span>}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <ReleaseStatusPill status={item.status} />
              <div className="text-[10.5px] text-stone-400">
                {item.checklist.filter((c) => c.done).length}/{item.checklist.length} kész
              </div>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="py-12 text-center text-[13px] text-stone-400">Nincs elem ebben a szűrőben.</div>
        )}
      </div>

      <ReleaseDetailSlideOver item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Datasheets List ────────────────────────────────────────────────────────
function DatasheetList() {
  const [selected, setSelected] = useState<MfgDatasheet | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Munkalapok</h1>
      </div>
      <div className="space-y-2">
        {DATASHEETS.map((ds) => {
          const m = DATASHEET_STATUS_META[ds.status]
          return (
            <button key={ds.id} onClick={() => setSelected(ds)}
              className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-orange-200 transition flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-stone-900">{ds.customer}</div>
                <div className="text-[11.5px] text-stone-500 mt-0.5">{ds.id} · {ds.team}</div>
                <div className="text-[11px] text-stone-400 mt-1">{ds.startDate} → {ds.dueDate} · {ds.productCount} termék</div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
              </span>
            </button>
          )
        })}
      </div>
      <DatasheetSlideOver ds={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function MfgPrepDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selected, setSelected] = useState<ReleaseItem | null>(null)
  const pending    = RELEASE_ITEMS.filter((r) => r.status === 'pending').length
  const inProd     = RELEASE_ITEMS.filter((r) => r.status === 'in_production').length
  const ready      = RELEASE_ITEMS.filter((r) => r.status === 'ready').length
  const blocked    = RELEASE_ITEMS.filter((r) => r.status === 'blocked').length

  const KpiCard = ({ label, value, sub, tone, icon }: { label: string; value: number; sub: string; tone: string; icon: string }) => (
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
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Gyártás-előkészítés</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Release queue és munkalapok áttekintése</p>
        </div>
        <button onClick={() => onScreen('queue')} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="clipboard" size={15} />Release queue
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Kiadásra vár" value={pending} sub="jóváhagyásra vár" tone="orange" icon="clipboard" />
        <KpiCard label="Gyártásban" value={inProd} sub="aktív gyártás" tone="amber" icon="production" />
        <KpiCard label="Beépítésre kész" value={ready} sub="QC átment" tone="emerald" icon="check" />
        <KpiCard label="Blokkolt" value={blocked} sub="anyag / CNC hiány" tone="rose" icon="alert" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Sürgős kiadásra vár</span>
          </div>
          <div className="divide-y divide-stone-50">
            {RELEASE_ITEMS.filter((r) => r.status === 'pending' || r.status === 'blocked').map((item) => (
              <button key={item.id} onClick={() => setSelected(item)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{item.project}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{item.customer} · {item.dueDate}</div>
                </div>
                <ReleaseStatusPill status={item.status} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100">
            <span className="text-[12.5px] font-semibold text-stone-800">Munkalapok</span>
          </div>
          <div className="divide-y divide-stone-50">
            {DATASHEETS.filter((d) => d.status === 'active' || d.status === 'draft').map((ds) => {
              const m = DATASHEET_STATUS_META[ds.status]
              return (
                <div key={ds.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-stone-900 truncate">{ds.customer}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{ds.team} · {ds.dueDate}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>
                    <span className={`w-1 h-1 rounded-full ${m.dot}`} />{m.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <ReleaseDetailSlideOver item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── MfgPrep World Page ─────────────────────────────────────────────────────
export function MfgPrepWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'queue')      return <ReleaseQueue />
    if (currentScreen === 'datasheets') return <DatasheetList />
    return <MfgPrepDashboard onScreen={(s) => navigate(`/w/mfgprep/${s}`)} />
  }

  return (
    <WorldShell worldKey="mfgprep" screen={currentScreen}
      onScreen={(key) => navigate(`/w/mfgprep/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

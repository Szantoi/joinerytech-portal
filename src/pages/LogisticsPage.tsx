import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  SHIPMENTS, SHIP_STATUS_META, SHIP_TYPE_META, SHIP_STEPS, LOG_TODAY,
  type Shipment, type ShipStatus, type ShipType,
} from '../mocks/logistics'

// ── Status Pill ────────────────────────────────────────────────────────────
function ShipStatusPill({ status, size = 'md' }: { status: ShipStatus; size?: 'sm' | 'md' }) {
  const m = SHIP_STATUS_META[status]
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11.5px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cls} ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Type Badge ─────────────────────────────────────────────────────────────
function ShipTypeBadge({ type, size = 'md' }: { type: ShipType; size?: 'sm' | 'md' }) {
  const m = SHIP_TYPE_META[type]
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-medium ${cls} ${m.pill}`}>
      <Icon name="truck" size={size === 'sm' ? 10 : 11} />{m.short}
    </span>
  )
}

// ── Shipment Stepper ───────────────────────────────────────────────────────
function ShipStepper({ sh }: { sh: Shipment }) {
  const steps = SHIP_STEPS[sh.type].filter((s) =>
    sh.type === 'delivery' && !sh.install ? s !== 'beszerelve' : true
  )
  const cur = steps.indexOf(sh.status)
  const isRek = sh.status === 'reklamacio'

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-wrap">
      {steps.map((st, i) => {
        const done = !isRek && i < cur
        const active = !isRek && i === cur
        const lbl = SHIP_STATUS_META[st]?.label ?? st
        return (
          <div key={st} className="flex items-center gap-1">
            {i > 0 && <div className={`h-px w-3 shrink-0 ${done ? 'bg-teal-400' : 'bg-stone-200'}`} />}
            <div className={`shrink-0 inline-flex items-center gap-1 px-1.5 h-6 rounded-full text-[10.5px] font-medium border ${
              active ? 'bg-sky-600 text-white border-sky-600' : done ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-stone-400 border-stone-200'
            }`}>
              {done && <Icon name="check" size={10} />}{lbl}
            </div>
          </div>
        )
      })}
      {isRek && (
        <div className="flex items-center gap-1">
          <div className="h-px w-3 shrink-0 bg-rose-300" />
          <div className="shrink-0 inline-flex items-center gap-1 px-1.5 h-6 rounded-full text-[10.5px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
            <Icon name="alert" size={10} />Reklamáció
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shipment Detail SlideOver ──────────────────────────────────────────────
function ShipmentDetailSlideOver({ sh, onClose }: { sh: Shipment | null; onClose: () => void }) {
  if (!sh) return null
  const m = SHIP_TYPE_META[sh.type]
  const ho = sh.handover

  return (
    <SlideOver open={true} onClose={onClose} title={sh.customer} subtitle={sh.id} width={520}>
      <div className="space-y-5 px-5 py-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <ShipStatusPill status={sh.status} />
          <ShipTypeBadge type={sh.type} />
          {sh.install && sh.type === 'delivery' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">+ telepítés</span>
          )}
          {sh.delegatedTo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">→ {sh.delegatedTo}</span>
          )}
        </div>

        {/* Stepper */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Státusz</div>
          <ShipStepper sh={sh} />
        </div>

        {/* Alapadatok */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Dátum / Időablak</div>
            <div className="text-[12px] font-mono text-stone-800">{sh.date}{sh.windowStart ? ` · ${sh.windowStart}–${sh.windowEnd}` : ''}</div>
          </div>
          {sh.vehicleName && (
            <div>
              <div className="text-[10.5px] text-stone-400 mb-0.5">Jármű</div>
              <div className="text-[12px] text-stone-800">{sh.vehicleName} <span className="text-stone-400 font-mono">{sh.vehiclePlate}</span></div>
            </div>
          )}
          {sh.crewName && (
            <div>
              <div className="text-[10.5px] text-stone-400 mb-0.5">Brigád</div>
              <div className="text-[12px] text-stone-800">{sh.crewName}</div>
            </div>
          )}
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Kapcsolattartó</div>
            <div className="text-[12px] text-stone-800">{sh.contact}</div>
            <div className="text-[11px] text-stone-500 font-mono">{sh.phone}</div>
          </div>
        </div>

        {/* Helyszín */}
        <div>
          <div className="text-[10.5px] text-stone-400 mb-0.5">Cím</div>
          <div className="text-[12px] text-stone-700">{sh.address}</div>
        </div>

        {/* Rakomány */}
        {(sh.loadM3 || sh.loadKg) ? (
          <div className="flex gap-4">
            {sh.loadM3 ? <div><div className="text-[10.5px] text-stone-400">Rakodás</div><div className="text-[12px] font-mono text-stone-800">{sh.loadM3} m³</div></div> : null}
            {sh.loadKg ? <div><div className="text-[10.5px] text-stone-400">Tömeg</div><div className="text-[12px] font-mono text-stone-800">{sh.loadKg} kg</div></div> : null}
            {sh.refLabel && <div className="flex-1"><div className="text-[10.5px] text-stone-400">Áru</div><div className="text-[12px] text-stone-700 truncate">{sh.refLabel}</div></div>}
          </div>
        ) : null}

        {/* Megjegyzés */}
        {sh.note && (
          <div className="text-[11.5px] text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">{sh.note}</div>
        )}

        {/* Napló */}
        {sh.log.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Eseménynapló</div>
            <div className="space-y-1.5">
              {sh.log.map((e, i) => (
                <div key={i} className="flex gap-3 text-[11.5px]">
                  <span className="font-mono text-stone-400 shrink-0">{e.at}</span>
                  <span className="text-stone-700">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Átadás-átvétel */}
        {sh.type === 'delivery' && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Átadás-átvétel</div>
            <div className="rounded-lg border border-stone-200 divide-y divide-stone-100 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 text-[12px]">
                <span className="text-stone-500">Fotók</span>
                <span className="text-stone-800 font-medium">{ho.photos} db</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-[12px]">
                <span className="text-stone-500">Jegyzőkönyv</span>
                <span className={ho.protocol ? 'text-emerald-700 font-medium' : 'text-stone-400'}>{ho.protocol ? 'Aláírva' : 'Hiányzik'}</span>
              </div>
              {ho.signedBy && (
                <div className="flex items-center justify-between px-3 py-2 text-[12px]">
                  <span className="text-stone-500">Aláírta</span>
                  <span className="text-stone-800">{ho.signedBy}</span>
                </div>
              )}
              {ho.deficiencies.length > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10.5px] text-stone-500 mb-1">Hiánytételek</div>
                  {ho.deficiencies.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11.5px] text-rose-700 bg-rose-50 px-2 py-1.5 rounded-md">
                      <Icon name="alert" size={12} className="mt-0.5 shrink-0" />{d.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Shipment Row ───────────────────────────────────────────────────────────
function ShipmentRow({ sh, onOpen }: { sh: Shipment; onOpen: (sh: Shipment) => void }) {
  const m = SHIP_TYPE_META[sh.type]
  return (
    <button onClick={() => onOpen(sh)} className="w-full text-left px-3.5 md:px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: m.accent + '1a', color: m.accent }}>
        <Icon name="truck" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-stone-900 truncate">{sh.customer}</span>
          {sh.install && sh.type === 'delivery' && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">+ telepítés</span>
          )}
          {sh.delegatedTo && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">→ {sh.delegatedTo}</span>
          )}
        </div>
        <div className="text-[11px] text-stone-500 truncate mt-0.5">{sh.id}{sh.refLabel ? ` · ${sh.refLabel}` : ''}</div>
        <div className="flex items-center gap-2 mt-1 text-[10.5px] text-stone-400">
          {sh.date && <span className="inline-flex items-center gap-1"><Icon name="calendar" size={11} />{sh.date}{sh.windowStart ? ` ${sh.windowStart}–${sh.windowEnd}` : ''}</span>}
          {sh.vehicleName && <span className="inline-flex items-center gap-1"><Icon name="truck" size={11} />{sh.vehicleName}</span>}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <ShipStatusPill status={sh.status} size="sm" />
        <Icon name="chevron" size={15} className="text-stone-300" />
      </div>
    </button>
  )
}

// ── Logistics Dashboard ────────────────────────────────────────────────────
function LogisticsDashboard() {
  const [selected, setSelected] = useState<Shipment | null>(null)
  const isLive = (s: Shipment) => !['atadva', 'beerkezett', 'kesz', 'torolve'].includes(s.status)
  const today = SHIPMENTS.filter((s) => s.date === LOG_TODAY && isLive(s))
  const enRoute = SHIPMENTS.filter((s) => s.status === 'uton')
  const waiting = SHIPMENTS.filter((s) => isLive(s) && s.status === 'tervezett' && s.date !== LOG_TODAY)
  const complaints = SHIPMENTS.filter((s) => s.handover.deficiencies.length > 0)

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
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Logisztika</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Kiszállítás, telepítés, felmérés · {LOG_TODAY}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Mai túrák" value={today.length} sub="aktív, ma ütemezve" tone="sky" icon="truck" />
        <KpiCard label="Úton" value={enRoute.length} sub="jelenleg úton" tone="cyan" icon="route" />
        <KpiCard label="Beosztásra vár" value={waiting.length} sub="tervezett, jövő dátum" tone="amber" icon="calendar" />
        <KpiCard label="Hiánytétel" value={complaints.length} sub="reklamáció / hiány" tone="rose" icon="alert" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Mai túrák</span>
            <span className="text-[11px] text-stone-400">{today.length} db</span>
          </div>
          {today.length > 0
            ? today.map((s) => <ShipmentRow key={s.id} sh={s} onOpen={setSelected} />)
            : <div className="px-4 py-8 text-center text-[12px] text-stone-400">Ma nincs ütemezett fuvar.</div>}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Következő fuvarok</span>
            <span className="text-[11px] text-stone-400">{waiting.length} db</span>
          </div>
          {waiting.length > 0
            ? waiting.map((s) => <ShipmentRow key={s.id} sh={s} onOpen={setSelected} />)
            : <div className="px-4 py-8 text-center text-[12px] text-stone-400">Minden fuvar be van osztva.</div>}
        </Card>
      </div>

      <ShipmentDetailSlideOver sh={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Shipment List Page ─────────────────────────────────────────────────────
function ShipmentListPage({ dir }: { dir: 'out' | 'in' }) {
  const [selected, setSelected] = useState<Shipment | null>(null)
  const [statusF, setStatusF] = useState<ShipStatus | 'all'>('all')
  const [q, setQ] = useState('')

  const inDir = (s: Shipment) => dir === 'in' ? s.type === 'pickup' : s.type !== 'pickup'
  const list = SHIPMENTS.filter((s) =>
    inDir(s) &&
    (statusF === 'all' || s.status === statusF) &&
    (!q.trim() || `${s.customer} ${s.id} ${s.refLabel ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  )

  const title = dir === 'in' ? 'Beszállítások' : 'Kiszállítások'
  const statusOptions: Array<{ k: ShipStatus | 'all'; l: string }> = [
    { k: 'all', l: 'Minden státusz' },
    { k: 'tervezett', l: 'Tervezett' },
    { k: 'uton', l: 'Úton' },
    { k: 'beszerelve', l: 'Beszerelve' },
    { k: 'atadva', l: 'Átadva' },
  ]

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1100px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés ügyfél / azonosító…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-200 text-[12.5px] bg-white outline-none focus:border-cyan-500" />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value as ShipStatus | 'all')}
          className="h-9 px-2.5 rounded-lg border border-stone-200 text-[12px] bg-white outline-none focus:border-cyan-500">
          {statusOptions.map((o) => <option key={o.k} value={o.k}>{o.l}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        {list.length > 0
          ? list.map((s) => <ShipmentRow key={s.id} sh={s} onOpen={setSelected} />)
          : <div className="px-4 py-12 text-center text-[12.5px] text-stone-400">Nincs találat.</div>}
      </Card>

      <ShipmentDetailSlideOver sh={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Logistics World Page ───────────────────────────────────────────────────
export function LogisticsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'outgoing') return <ShipmentListPage dir="out" />
    if (currentScreen === 'incoming') return <ShipmentListPage dir="in" />
    return <LogisticsDashboard />
  }

  return (
    <WorldShell worldKey="logistics" screen={currentScreen}
      onScreen={(key) => navigate(`/w/logistics/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

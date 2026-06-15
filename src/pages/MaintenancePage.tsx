import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  ASSETS, TICKETS, SCHEDULED,
  ASSET_STATUS_META, TICKET_TYPE_META, TICKET_STATUS_META,
  type MaintenanceAsset, type MaintenanceTicket,
  type AssetStatus, type TicketType, type TicketStatus,
} from '../mocks/maintenance'

// ── Helpers ────────────────────────────────────────────────────────────────
function AssetStatusPill({ status }: { status: AssetStatus }) {
  const m = ASSET_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function TicketTypeBadge({ type }: { type: TicketType }) {
  const m = TICKET_TYPE_META[type]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

function TicketStatusPill({ status }: { status: TicketStatus }) {
  const m = TICKET_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Asset Detail SlideOver ─────────────────────────────────────────────────
function AssetDetailSlideOver({ asset, onClose }: { asset: MaintenanceAsset | null; onClose: () => void }) {
  if (!asset) return null
  const assetTickets = TICKETS.filter((t) => t.assetId === asset.id && t.status !== 'done')
  return (
    <SlideOver open={true} onClose={onClose} title={asset.name} subtitle={`${asset.id} · ${asset.kind}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <AssetStatusPill status={asset.status} />
          <span className="text-[11.5px] text-stone-500">{asset.location}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Utolsó szerviz</div>
            <div className="text-[12px] font-mono text-stone-800">{asset.lastService}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Következő szerviz</div>
            <div className="text-[12px] font-mono text-stone-800">{asset.nextService}</div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
            Nyitott jegyek ({assetTickets.length})
          </div>
          {assetTickets.length === 0 ? (
            <div className="text-[12px] text-stone-400 py-2">Nincs nyitott jegy</div>
          ) : (
            <div className="space-y-2">
              {assetTickets.map((t) => (
                <div key={t.id} className="border border-stone-100 rounded-lg px-3 py-2.5 bg-stone-50">
                  <div className="flex items-center gap-2 mb-1">
                    <TicketTypeBadge type={t.type} />
                    <TicketStatusPill status={t.status} />
                  </div>
                  <div className="text-[12px] font-medium text-stone-800">{t.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">Határidő: {t.dueDate}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

// ── Ticket Detail SlideOver ────────────────────────────────────────────────
function TicketDetailSlideOver({ ticket, onClose }: { ticket: MaintenanceTicket | null; onClose: () => void }) {
  if (!ticket) return null
  const PRIO_META = {
    urgent: 'bg-rose-100 text-rose-800',
    high:   'bg-rose-50 text-rose-700',
    medium: 'bg-amber-50 text-amber-700',
    low:    'bg-stone-100 text-stone-600',
  }
  const PRIO_LABELS = { urgent: 'Sürgős', high: 'Magas', medium: 'Közepes', low: 'Alacsony' }
  return (
    <SlideOver open={true} onClose={onClose} title={ticket.title} subtitle={`${ticket.id} · ${ticket.assetName}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          <TicketTypeBadge type={ticket.type} />
          <TicketStatusPill status={ticket.status} />
          <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${PRIO_META[ticket.priority]}`}>
            {PRIO_LABELS[ticket.priority]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Bejelentette</div>
            <div className="text-[12px] text-stone-800">{ticket.reportedBy}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Határidő</div>
            <div className="text-[12px] font-mono text-stone-800">{ticket.dueDate}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Bejelentve</div>
            <div className="text-[12px] font-mono text-stone-800">{ticket.reportedAt}</div>
          </div>
        </div>

        {ticket.note && (
          <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11.5px] text-stone-600">
            {ticket.note}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Asset List ─────────────────────────────────────────────────────────────
function AssetList() {
  const [selected, setSelected] = useState<MaintenanceAsset | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Eszközök</h1>
      </div>
      <div className="space-y-2">
        {ASSETS.map((asset) => (
          <button key={asset.id} onClick={() => setSelected(asset)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-amber-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900">{asset.name}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{asset.kind} · {asset.location}</div>
              <div className="text-[11px] text-stone-400 mt-1 inline-flex items-center gap-1">
                <Icon name="calendar" size={11} />Következő szerviz: <span className="font-mono ml-1">{asset.nextService}</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <AssetStatusPill status={asset.status} />
              {asset.openTickets > 0 && (
                <div className="text-[10.5px] text-rose-600 font-medium">{asset.openTickets} nyitott jegy</div>
              )}
            </div>
          </button>
        ))}
      </div>
      <AssetDetailSlideOver asset={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Tickets List ───────────────────────────────────────────────────────────
function TicketsList() {
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Jegyek</h1>
      </div>
      <div className="space-y-2">
        {TICKETS.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-amber-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <TicketTypeBadge type={t.type} />
                <TicketStatusPill status={t.status} />
              </div>
              <div className="text-[13px] font-semibold text-stone-900">{t.title}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{t.assetName} · {t.reportedBy}</div>
              <div className="text-[11px] text-stone-400 mt-1 font-mono">Határidő: {t.dueDate}</div>
            </div>
          </button>
        ))}
      </div>
      <TicketDetailSlideOver ticket={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Schedule View ──────────────────────────────────────────────────────────
function ScheduleView() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Ütemterv</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Közelgő karbantartások</p>
      </div>
      <div className="space-y-2">
        {SCHEDULED.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900">{s.assetName}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5">{s.type}</div>
              <div className="text-[11px] text-stone-400 mt-1 inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Icon name="user" size={11} />{s.assignee}
                </span>
                <span>·</span>
                <span>{s.duration} óra</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[12px] font-mono text-stone-700 font-medium">{s.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function MaintenanceDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selectedAsset, setSelectedAsset] = useState<MaintenanceAsset | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)

  const activeAssets = ASSETS.filter((a) => a.status === 'ok').length
  const warnAssets   = ASSETS.filter((a) => a.status === 'warning').length
  const downAssets   = ASSETS.filter((a) => a.status === 'down').length
  const openTickets  = TICKETS.filter((t) => t.status === 'open' || t.status === 'in_progress').length

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
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Karbantartás</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Gépek, karbantartási jegyek, ütemezés</p>
        </div>
        <button onClick={() => onScreen('tickets')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="wrench" size={15} />Jegyek
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Aktív gépek"     value={activeAssets} sub="üzemel"          tone="emerald" icon="check" />
        <KpiCard label="Figyelmeztetés"  value={warnAssets}   sub="ellenőrzés kell" tone="amber"   icon="alert" />
        <KpiCard label="Leállt"          value={downAssets}   sub="nem üzemel"      tone="rose"    icon="x" />
        <KpiCard label="Nyitott jegyek"  value={openTickets}  sub="kezelés szükséges" tone="amber" icon="clipboard" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Gépek állapota</span>
            <button onClick={() => onScreen('assets')} className="text-[11px] text-amber-600 hover:text-amber-800">Összes →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {ASSETS.map((asset) => (
              <button key={asset.id} onClick={() => setSelectedAsset(asset)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{asset.name}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{asset.kind}</div>
                </div>
                <AssetStatusPill status={asset.status} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Aktív jegyek</span>
            <button onClick={() => onScreen('tickets')} className="text-[11px] text-amber-600 hover:text-amber-800">Összes →</button>
          </div>
          <div className="divide-y divide-stone-50">
            {TICKETS.filter((t) => t.status !== 'done' && t.status !== 'deferred').map((t) => (
              <button key={t.id} onClick={() => setSelectedTicket(t)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50/60 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{t.title}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{t.assetName} · {t.dueDate}</div>
                </div>
                <TicketTypeBadge type={t.type} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <AssetDetailSlideOver asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      <TicketDetailSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  )
}

// ── Maintenance World Page ─────────────────────────────────────────────────
export function MaintenanceWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'assets')   return <AssetList />
    if (currentScreen === 'tickets')  return <TicketsList />
    if (currentScreen === 'schedule') return <ScheduleView />
    return <MaintenanceDashboard onScreen={(s) => navigate(`/w/maintenance/${s}`)} />
  }

  return (
    <WorldShell worldKey="maintenance" screen={currentScreen}
      onScreen={(key) => navigate(`/w/maintenance/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

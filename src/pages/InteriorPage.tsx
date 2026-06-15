import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  ROOMS, FURNITURE_ITEMS,
  ROOM_STATUS_META, FURNITURE_TYPE_META,
  type RoomConfig, type FurnitureItem,
} from '../mocks/interior'

// ── Helpers ────────────────────────────────────────────────────────────────
function huf(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M Ft'
  if (n >= 1_000)     return Math.round(n / 1_000) + ' eFt'
  return n + ' Ft'
}

function dims(w: number, d: number): string {
  return `${w}×${d} cm`
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function IntKpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-3.5">
      <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className="text-[26px] font-semibold tracking-tight tabular-nums mt-1 text-stone-900">{value}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Room Status Pill ───────────────────────────────────────────────────────
function RoomStatusPill({ status }: { status: RoomConfig['status'] }) {
  const m = ROOM_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Room Detail SlideOver ──────────────────────────────────────────────────
function RoomDetailSlideOver({ room, onClose }: { room: RoomConfig | null; onClose: () => void }) {
  if (!room) return null
  const r = room
  const items = FURNITURE_ITEMS.filter((f) => f.roomId === r.id)
  const totalValue = items.reduce((s, f) => s + f.unitPrice * f.quantity, 0)

  return (
    <SlideOver open={true} onClose={onClose} title={r.name} subtitle={`${r.id} · ${r.project}`} width={520}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <RoomStatusPill status={r.status} />
          <span className="text-[11.5px] text-stone-500">Tervező: {r.designer}</span>
          <span className="text-[11.5px] text-stone-500">{dims(r.width, r.depth)}</span>
        </div>

        {/* Bútorok */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Bútorok</div>
          <div className="space-y-1.5">
            {items.map((f) => {
              const tm = FURNITURE_TYPE_META[f.type]
              return (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-100">
                  <span className={`inline-flex px-2 h-5 items-center rounded-full text-[10px] font-medium ${tm.bg} ${tm.fg}`}>{tm.label}</span>
                  <span className="flex-1 text-[12px] text-stone-700 truncate">{f.name}</span>
                  {f.quantity > 1 && <span className="text-[11px] text-stone-400">{f.quantity}×</span>}
                  <span className="text-[12px] font-medium text-stone-800">{huf(f.unitPrice)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Anyag összesítő */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Anyag összesítő</div>
          {Array.from(new Set(items.map((f) => f.material))).map((mat) => (
            <div key={mat} className="text-[12px] text-stone-700 py-1 border-b border-stone-100 last:border-0">{mat}</div>
          ))}
        </div>

        {/* Összérték */}
        <div className="bg-stone-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <span className="text-[12px] text-stone-600">Összesített bútor érték</span>
          <span className="text-[15px] font-semibold text-stone-900">{huf(totalValue)}</span>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function InteriorDashboard() {
  const [selected, setSelected] = useState<RoomConfig | null>(null)
  const activeRooms = ROOMS.filter((r) => r.status === 'designing').length
  const finalizedRooms = ROOMS.filter((r) => r.status === 'finalized').length
  const totalValue = FURNITURE_ITEMS.reduce((s, f) => s + f.unitPrice * f.quantity, 0)
  const totalFurniture = FURNITURE_ITEMS.reduce((s, f) => s + f.quantity, 0)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-5">
      <div>
        <div className="text-[16px] font-semibold tracking-tight text-stone-900">Belső tér</div>
        <div className="text-[11.5px] text-stone-500">Szoba-konfigurációk és bútor elrendezés</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <IntKpi label="Aktív konfiguráció" value={activeRooms} sub="tervezés alatt" />
        <IntKpi label="Véglegesített" value={finalizedRooms} sub={`${ROOMS.length} szoba összesen`} />
        <IntKpi label="Összesített bútor érték" value={huf(totalValue)} sub="minden konfiguráció" />
        <IntKpi label="Bútor elemek" value={totalFurniture} sub="összes tétel" />
      </div>

      {/* Room config list */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80">
          <div className="text-[13px] font-semibold text-stone-900">Szoba-konfigurációk</div>
        </div>
        <div className="divide-y divide-stone-100">
          {ROOMS.map((r) => {
            const items = FURNITURE_ITEMS.filter((f) => f.roomId === r.id)
            const roomValue = items.reduce((s, f) => s + f.unitPrice * f.quantity, 0)
            return (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(r)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-stone-900">{r.name}</span>
                    <RoomStatusPill status={r.status} />
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{r.project} · {dims(r.width, r.depth)} · {r.designer}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-stone-800">{huf(roomValue)}</div>
                  <div className="text-[11px] text-stone-500">{r.furnitureCount} bútor elem</div>
                </div>
                <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
              </div>
            )
          })}
        </div>
      </Card>
      <RoomDetailSlideOver room={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Furniture Cards ────────────────────────────────────────────────────────
function FurnitureCards() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Bútor kártyák</div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {FURNITURE_ITEMS.map((f) => {
          const tm = FURNITURE_TYPE_META[f.type]
          return (
            <div key={f.id} className="bg-white border border-stone-200/80 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-stone-900">{f.name}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{f.width}×{f.depth}×{f.height} cm</div>
                </div>
                <span className={`inline-flex px-2 h-5 items-center rounded-full text-[10px] font-medium shrink-0 ${tm.bg} ${tm.fg}`}>{tm.label}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100">
                <div className="text-[11px] text-stone-500 truncate">{f.material}</div>
                <div className="text-[11px] text-stone-500">{f.color}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[12px] font-semibold text-stone-800">{huf(f.unitPrice)}</div>
                {f.quantity > 1 && <div className="text-[11px] text-stone-500">{f.quantity} db</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Room Configs (full list) ───────────────────────────────────────────────
function RoomList() {
  const [selected, setSelected] = useState<RoomConfig | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Szoba-konfigurációk</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {ROOMS.map((r) => {
            const items = FURNITURE_ITEMS.filter((f) => f.roomId === r.id)
            const roomValue = items.reduce((s, f) => s + f.unitPrice * f.quantity, 0)
            return (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(r)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium text-stone-900">{r.name}</span>
                    <RoomStatusPill status={r.status} />
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{r.project} · {r.designer}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-stone-800">{huf(roomValue)}</div>
                  <div className="text-[11px] text-stone-500">{dims(r.width, r.depth)}</div>
                </div>
                <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
              </div>
            )
          })}
        </div>
      </Card>
      <RoomDetailSlideOver room={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── World Page ─────────────────────────────────────────────────────────────
export function InteriorWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'rooms')     return <RoomList />
    if (currentScreen === 'furniture') return <FurnitureCards />
    return <InteriorDashboard />
  }

  return (
    <WorldShell
      worldKey="interior"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/interior/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        {renderContent()}
      </div>
    </WorldShell>
  )
}

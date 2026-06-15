import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  TRADE_QUOTES, TRADE_POS, TRADE_PARTNERS,
  QUOTE_STATUS_META, PO_STATUS_META, PARTNER_KIND_META,
  type TradeQuote, type TradePO, type TradePartner,
} from '../mocks/trade'

// ── Helpers ────────────────────────────────────────────────────────────────
function huf(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M Ft'
  if (n >= 1_000)     return Math.round(n / 1_000) + ' eFt'
  return n + ' Ft'
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function TrKpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-3.5">
      <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className="text-[26px] font-semibold tracking-tight tabular-nums mt-1 text-stone-900">{value}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Quote Status Pill ──────────────────────────────────────────────────────
function QuoteStatusPill({ status }: { status: TradeQuote['status'] }) {
  const m = QUOTE_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── PO Status Pill ─────────────────────────────────────────────────────────
function PoStatusPill({ status }: { status: TradePO['status'] }) {
  const m = PO_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Quote Detail SlideOver ─────────────────────────────────────────────────
function QuoteDetailSlideOver({ quote, onClose }: { quote: TradeQuote | null; onClose: () => void }) {
  if (!quote) return null
  const q = quote
  return (
    <SlideOver open={true} onClose={onClose} title={q.customer} subtitle={`${q.id} · Érvényes: ${q.validUntil}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <QuoteStatusPill status={q.status} />
          <span className="text-[11.5px] text-stone-500 inline-flex items-center gap-1">
            <Icon name="calendar" size={13} />{q.date}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Nettó összeg</div>
            <div className="text-[20px] font-semibold text-stone-900 mt-1">{huf(q.totalNet)}</div>
          </div>
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Tételek</div>
            <div className="text-[20px] font-semibold text-stone-900 mt-1">{q.items} db</div>
          </div>
        </div>
        {q.note && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-[12px] text-amber-800">
            {q.note}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── PO Detail SlideOver ────────────────────────────────────────────────────
function PoDetailSlideOver({ po, onClose }: { po: TradePO | null; onClose: () => void }) {
  if (!po) return null
  const p = po
  return (
    <SlideOver open={true} onClose={onClose} title={p.supplier} subtitle={`${p.id} · Szállítás: ${p.deliveryDate}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3">
          <PoStatusPill status={p.status} />
          <span className="text-[11.5px] text-stone-500 inline-flex items-center gap-1">
            <Icon name="calendar" size={13} />{p.date}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Nettó összeg</div>
            <div className="text-[20px] font-semibold text-stone-900 mt-1">{huf(p.totalNet)}</div>
          </div>
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Tételek</div>
            <div className="text-[20px] font-semibold text-stone-900 mt-1">{p.items} db</div>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function TradeDashboard() {
  const openQuotes = TRADE_QUOTES.filter((q) => q.status === 'draft' || q.status === 'sent').length
  const activePOs = TRADE_POS.filter((p) => p.status === 'pending' || p.status === 'confirmed').length
  const monthlyTurnover = TRADE_QUOTES.filter((q) => q.status === 'accepted').reduce((s, q) => s + q.totalNet, 0)
  const totalPartners = TRADE_PARTNERS.filter((p) => p.active).length

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-5">
      <div>
        <div className="text-[16px] font-semibold tracking-tight text-stone-900">Kereskedelem</div>
        <div className="text-[11.5px] text-stone-500">Ajánlatok, megrendelések, partnerek áttekintése</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TrKpi label="Nyitott ajánlatok" value={openQuotes} sub="draft + elküldve" />
        <TrKpi label="Aktív PO" value={activePOs} sub="függőben + megerősítve" />
        <TrKpi label="Elfogadott (havi)" value={huf(monthlyTurnover)} sub="nettó forgalom" />
        <TrKpi label="Aktív partnerek" value={totalPartners} sub={`${TRADE_PARTNERS.length} összesen`} />
      </div>

      {/* Open quotes */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200/80">
          <div className="text-[13px] font-semibold text-stone-900">Nyitott ajánlatok</div>
        </div>
        <div className="divide-y divide-stone-100">
          {TRADE_QUOTES.filter((q) => q.status !== 'rejected').slice(0, 4).map((q) => (
            <div key={q.id} className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium text-stone-900 truncate">{q.customer}</span>
                  <QuoteStatusPill status={q.status} />
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">{q.id}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-semibold text-stone-800">{huf(q.totalNet)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Quotes List ────────────────────────────────────────────────────────────
function QuotesList() {
  const [selected, setSelected] = useState<TradeQuote | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Árajánlatok</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {TRADE_QUOTES.map((q) => (
            <div key={q.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(q)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-stone-900">{q.customer}</span>
                  <QuoteStatusPill status={q.status} />
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">{q.id} · Érvényes: {q.validUntil}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-semibold text-stone-800">{huf(q.totalNet)}</div>
                <div className="text-[11px] text-stone-500">{q.items} tétel</div>
              </div>
              <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
      <QuoteDetailSlideOver quote={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── PO List ────────────────────────────────────────────────────────────────
function POList() {
  const [selected, setSelected] = useState<TradePO | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Vevői megrendelések (PO)</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {TRADE_POS.map((p) => (
            <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(p)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-stone-900">{p.supplier}</span>
                  <PoStatusPill status={p.status} />
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">{p.id} · Szállítás: {p.deliveryDate}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-semibold text-stone-800">{huf(p.totalNet)}</div>
                <div className="text-[11px] text-stone-500">{p.items} tétel</div>
              </div>
              <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
      <PoDetailSlideOver po={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Partners List ──────────────────────────────────────────────────────────
function PartnersList() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Partnerek</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {TRADE_PARTNERS.map((p) => {
            const km = PARTNER_KIND_META[p.kind]
            return (
              <div key={p.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium text-stone-900">{p.name}</span>
                    <span className={`inline-flex px-2 h-5 items-center rounded-full text-[10px] font-medium ${km.bg} ${km.fg}`}>{km.label}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{p.city} · {p.contact}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-stone-800">{huf(p.turnoverYtd)}</div>
                  <div className="text-[11px] text-stone-500">YTD forgalom</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── World Page ─────────────────────────────────────────────────────────────
export function TradeWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'quotes')   return <QuotesList />
    if (currentScreen === 'pos')      return <POList />
    if (currentScreen === 'partners') return <PartnersList />
    return <TradeDashboard />
  }

  return (
    <WorldShell
      worldKey="trade"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/trade/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        {renderContent()}
      </div>
    </WorldShell>
  )
}

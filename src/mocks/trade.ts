// Kereskedelem világ — ajánlatok, megrendelések, partnerek

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type PoStatus = 'pending' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
export type PartnerKind = 'customer' | 'supplier' | 'both'

export interface TradeQuote {
  id: string
  customer: string
  date: string
  validUntil: string
  status: QuoteStatus
  totalNet: number
  items: number
  note?: string
}

export interface TradePO {
  id: string
  supplier: string
  date: string
  deliveryDate: string
  status: PoStatus
  totalNet: number
  items: number
}

export interface TradePartner {
  id: string
  name: string
  kind: PartnerKind
  city: string
  contact: string
  phone: string
  turnoverYtd: number
  active: boolean
}

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; bg: string; fg: string; dot: string }> = {
  draft:    { label: 'Piszkozat',  bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
  sent:     { label: 'Elküldve',   bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  accepted: { label: 'Elfogadva',  bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Elutasítva', bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
}

export const PO_STATUS_META: Record<PoStatus, { label: string; bg: string; fg: string; dot: string }> = {
  pending:   { label: 'Függőben',    bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  confirmed: { label: 'Megerősítve', bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  delivered: { label: 'Megérkezett', bg: 'bg-teal-50',    fg: 'text-teal-700',    dot: 'bg-teal-500' },
  invoiced:  { label: 'Számlázva',   bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Törölve',     bg: 'bg-stone-100',  fg: 'text-stone-500',   dot: 'bg-stone-400' },
}

export const PARTNER_KIND_META: Record<PartnerKind, { label: string; bg: string; fg: string }> = {
  customer: { label: 'Vevő',     bg: 'bg-teal-50',  fg: 'text-teal-700' },
  supplier: { label: 'Szállító', bg: 'bg-amber-50', fg: 'text-amber-700' },
  both:     { label: 'Mindkettő', bg: 'bg-violet-50', fg: 'text-violet-700' },
}

export const TRADE_QUOTES: TradeQuote[] = [
  { id: 'AJ-2426-018', customer: 'Bognár Bútor Kft.',        date: '2026-04-25', validUntil: '2026-05-25', status: 'sent',     totalNet: 1240000, items: 12, note: 'Konyhabútor sor, tölgy dekor' },
  { id: 'AJ-2426-017', customer: 'Doorstar Hungary Zrt.',    date: '2026-04-22', validUntil: '2026-05-22', status: 'accepted', totalNet: 3850000, items: 32 },
  { id: 'AJ-2426-016', customer: 'Hegyi Lakberendezés Bt.',  date: '2026-04-20', validUntil: '2026-05-20', status: 'draft',    totalNet: 680000,  items: 8 },
  { id: 'AJ-2426-015', customer: 'Tóth Konyha és Bútor',    date: '2026-04-15', validUntil: '2026-05-15', status: 'rejected', totalNet: 920000,  items: 10, note: 'Ár nem megfelelő' },
  { id: 'AJ-2426-014', customer: 'Szabó Lakberendezés',      date: '2026-04-10', validUntil: '2026-05-10', status: 'sent',     totalNet: 445000,  items: 6 },
]

export const TRADE_POS: TradePO[] = [
  { id: 'PO-2426-044', supplier: 'Egger Faipari Kft.',  date: '2026-04-26', deliveryDate: '2026-05-02', status: 'confirmed', totalNet: 184000, items: 5 },
  { id: 'PO-2426-043', supplier: 'Hettich Hungary',     date: '2026-04-24', deliveryDate: '2026-04-30', status: 'delivered', totalNet: 92000,  items: 8 },
  { id: 'PO-2426-042', supplier: 'Falco Sopron Zrt.',   date: '2026-04-22', deliveryDate: '2026-04-28', status: 'invoiced',  totalNet: 56000,  items: 3 },
  { id: 'PO-2426-041', supplier: 'Kronospan HU Zrt.',   date: '2026-04-18', deliveryDate: '2026-04-25', status: 'pending',   totalNet: 228000, items: 12 },
]

export const TRADE_PARTNERS: TradePartner[] = [
  { id: 'PAR-001', name: 'Bognár Bútor Kft.',       kind: 'customer', city: 'Pécs',       contact: 'Bognár J.',  phone: '+36 72 412 333', turnoverYtd: 2840000, active: true },
  { id: 'PAR-002', name: 'Doorstar Hungary Zrt.',   kind: 'customer', city: 'Budapest',   contact: 'Fekete M.',  phone: '+36 1 880 5200', turnoverYtd: 8650000, active: true },
  { id: 'PAR-003', name: 'Hegyi Lakberendezés Bt.', kind: 'customer', city: 'Miskolc',    contact: 'Hegyi A.',   phone: '+36 46 310 440', turnoverYtd: 1120000, active: true },
  { id: 'PAR-004', name: 'Egger Faipari Kft.',      kind: 'supplier', city: 'Sopron',     contact: 'Molnár P.',  phone: '+36 99 544 100', turnoverYtd: 4200000, active: true },
  { id: 'PAR-005', name: 'Hettich Hungary',         kind: 'both',     city: 'Budapest',   contact: 'Tóth M.',    phone: '+36 1 421 3300', turnoverYtd: 1950000, active: true },
  { id: 'PAR-006', name: 'Falco Sopron Zrt.',       kind: 'supplier', city: 'Sopron',     contact: 'Kovács E.',  phone: '+36 99 310 200', turnoverYtd: 820000,  active: false },
]

export const TRADE_TODAY = '2026-04-28'

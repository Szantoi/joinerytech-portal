// ─── Types ────────────────────────────────────────────────────────────────────

export type QuoteStatusApi =
  | 'Draft' | 'Sent' | 'Accepted' | 'Rejected'
  | 'Archived' | 'ConversionPending' | 'Converted' | 'Expired'

export interface PagedResult<T> { items: T[]; totalCount: number }

export interface CustomerDto {
  id: string
  name: string
  type: 'Lead' | 'Active' | 'Inactive'
  contactName: string
  contactEmail: string
  contactPhone: string
  city: string
  openQuoteCount: number
  totalOrderValue: number
  createdAt: string
}

export interface QuoteListItemDto {
  id: string
  quoteNumber: string
  customerName: string
  status: QuoteStatusApi
  createdAt: string
  expiresAt: string | null
  lineCount: number
  totalValue: number
  ownerName: string
}

export interface QuoteLineDto {
  id: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface QuoteDetailDto extends QuoteListItemDto {
  customerId: string
  lines: QuoteLineDto[]
  subtotal: number
  vatAmount: number
  total: number
  note?: string
}

export interface Address {
  street: string
  city: string
  zip: string
  country: string
}

export interface CustomerDetailDto extends CustomerDto {
  billingAddress?: Address
  shippingAddress?: Address
}

// ─── Status / type maps ───────────────────────────────────────────────────────

export interface StatusStyle { label: string; bg: string; fg: string; dot: string }

export const QUOTE_STATUS_MAP: Record<QuoteStatusApi, StatusStyle> = {
  Draft:             { label: 'Vázlat',          bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  Sent:              { label: 'Kiküldve',         bg: 'bg-sky-50',      fg: 'text-sky-700',     dot: 'bg-sky-400' },
  Accepted:          { label: 'Elfogadva',        bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Rejected:          { label: 'Elutasítva',       bg: 'bg-red-50',      fg: 'text-red-600',     dot: 'bg-red-400' },
  Archived:          { label: 'Archivált',        bg: 'bg-stone-50',    fg: 'text-stone-400',   dot: 'bg-stone-300' },
  ConversionPending: { label: 'Gyártásba küldve', bg: 'bg-amber-50',    fg: 'text-amber-700',   dot: 'bg-amber-400' },
  Converted:         { label: 'Átalakítva',       bg: 'bg-teal-50',     fg: 'text-teal-700',    dot: 'bg-teal-500' },
  Expired:           { label: 'Lejárt',           bg: 'bg-stone-100',   fg: 'text-stone-500',   dot: 'bg-stone-300' },
}

export const CUSTOMER_TYPE_STYLE: Record<string, { label: string; avatarFrom: string; avatarTo: string; bg: string; fg: string }> = {
  Lead:     { label: 'Lead',         avatarFrom: 'from-amber-300',  avatarTo: 'to-amber-500',  bg: 'bg-amber-100',  fg: 'text-amber-700' },
  Active:   { label: 'Aktív ügyfél', avatarFrom: 'from-indigo-400', avatarTo: 'to-indigo-600', bg: 'bg-indigo-100', fg: 'text-indigo-700' },
  Inactive: { label: 'Inaktív',      avatarFrom: 'from-stone-300',  avatarTo: 'to-stone-400',  bg: 'bg-stone-100',  fg: 'text-stone-500' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const VAT_RATE = 0.27
export function calcVat(net: number) { return Math.round(net * VAT_RATE) }
export function calcGross(net: number) { return net + calcVat(net) }
export function fmtHuf(n: number) { return n.toLocaleString('hu-HU') + ' Ft' }
export function fmtM(n: number) { return (n / 1_000_000).toFixed(1) + 'M' }


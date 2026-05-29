import { QUOTES, CUSTOMERS } from '../mocks/worlds'

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

// ─── Mock lines ───────────────────────────────────────────────────────────────

const PRODUCT_POOL = [
  { description: 'Belső ajtó 90cm', unitPrice: 85_000 },
  { description: 'Tok szett 90cm', unitPrice: 18_000 },
  { description: 'Polcos szekrény 80cm', unitPrice: 145_000 },
  { description: 'Konyhai alsó szekrény 60cm', unitPrice: 89_000 },
  { description: 'Belső ajtó 80cm', unitPrice: 72_000 },
  { description: 'Élzárás ABS 2mm (fm)', unitPrice: 4_500 },
  { description: 'CNC megmunkálás (óra)', unitPrice: 12_000 },
]

export function getMockLines(quoteId: string): QuoteLineDto[] {
  const seed = quoteId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const count = (seed % 4) + 2
  return Array.from({ length: count }, (_, i) => {
    const product = PRODUCT_POOL[(seed + i * 3) % PRODUCT_POOL.length]
    const quantity = ((seed + i * 7) % 8) + 1
    const lineTotal = product.unitPrice * quantity
    return {
      id: `line-${quoteId}-${i}`,
      description: product.description,
      quantity,
      unitPrice: product.unitPrice,
      lineTotal,
    }
  })
}

// ─── Mock fallbacks ───────────────────────────────────────────────────────────

const MOCK_STATUS_TO_API: Record<string, QuoteStatusApi> = {
  draft: 'Draft', sent: 'Sent', approved: 'Accepted',
  rejected: 'Rejected', expired: 'Archived',
}

export const QUOTES_FALLBACK: QuoteListItemDto[] = QUOTES.map((q) => ({
  id: q.id,
  quoteNumber: q.id,
  customerName: q.customer,
  status: MOCK_STATUS_TO_API[q.status] ?? 'Draft',
  createdAt: q.date,
  expiresAt: q.expires,
  lineCount: q.items,
  totalValue: q.value,
  ownerName: q.owner,
}))

export const CUSTOMERS_FALLBACK: CustomerDto[] = CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  type: 'Active' as const,
  contactName: c.contact,
  contactEmail: c.email,
  contactPhone: c.phone,
  city: c.city,
  openQuoteCount: c.openOrders,
  totalOrderValue: c.ltv,
  createdAt: `${c.since}-01-01`,
}))

export function getMockQuoteDetail(quoteId: string): QuoteDetailDto {
  const found = QUOTES_FALLBACK.find((q) => q.id === quoteId)
  const lines = getMockLines(quoteId)
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  return {
    id: quoteId,
    quoteNumber: found?.quoteNumber ?? quoteId,
    customerName: found?.customerName ?? '—',
    customerId: '',
    status: found?.status ?? 'Draft',
    createdAt: found?.createdAt ?? '2026-05-01',
    expiresAt: found?.expiresAt ?? null,
    lineCount: lines.length,
    totalValue: calcGross(subtotal),
    ownerName: found?.ownerName ?? '—',
    lines,
    subtotal,
    vatAmount: calcVat(subtotal),
    total: calcGross(subtotal),
  }
}

export function getMockCustomerDetail(customerId: string): CustomerDetailDto {
  const found = CUSTOMERS_FALLBACK.find((c) => c.id === customerId)
  const base: CustomerDto = found ?? {
    id: customerId, name: '—', type: 'Active',
    contactName: '—', contactEmail: '—', contactPhone: '—',
    city: '—', openQuoteCount: 0, totalOrderValue: 0, createdAt: '2024-01-01',
  }
  return {
    ...base,
    billingAddress: { street: 'Ipari park 14.', city: base.city, zip: '2600', country: 'HU' },
    shippingAddress: { street: 'Ipari park 14.', city: base.city, zip: '2600', country: 'HU' },
  }
}

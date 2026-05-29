export { SUPPLIERS_FALLBACK } from './data-procurement'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequisitionStatus = 'Draft' | 'Approved' | 'Rejected' | 'ConvertedToPO'
export type InvoiceStatus = 'Received' | 'Matched' | 'Exception' | 'Approved' | 'Disputed'
export type PriceListStatus = 'Draft' | 'Active' | 'Expired'
export type MatchStatus = 'OK' | 'Warning' | 'Exception'

export interface RequisitionDto {
  id: string
  reqNumber: string
  materialCode: string
  materialName: string
  quantity: number
  unit: string
  preferredSupplierName?: string
  note?: string
  status: RequisitionStatus
  submittedBy: string
  submittedAt: string
}

export interface InvoiceLineDto {
  id: string
  materialName: string
  materialCode?: string
  qty: number
  unitPrice: number
  vatRate: number
  lineTotal: number
  // Three-Way Match
  poQty?: number
  deliveredQty?: number
  matchStatus?: MatchStatus
  variancePct?: number
}

export interface InvoiceDto {
  id: string
  invoiceNumber: string
  supplierName: string
  poReference?: string
  totalNet: number
  totalVat: number
  totalGross: number
  status: InvoiceStatus
  recordedBy: string
  invoiceDate: string
  lines: InvoiceLineDto[]
}

export interface PriceListEntryDto {
  id: string
  materialCode: string
  materialName: string
  unitPrice: number
  currency: string
  isBestPrice?: boolean
}

export interface PriceListDto {
  id: string
  listNumber: string
  supplierName: string
  status: PriceListStatus
  validFrom: string
  validTo?: string
  entries: PriceListEntryDto[]
}

// ─── Status maps ──────────────────────────────────────────────────────────────

export const REQ_STATUS_STYLE: Record<RequisitionStatus, { label: string; bg: string; fg: string; dot: string }> = {
  Draft:         { label: 'Vázlat',          bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  Approved:      { label: 'Jóváhagyva',      bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Rejected:      { label: 'Visszautasítva',  bg: 'bg-red-50',      fg: 'text-red-600',     dot: 'bg-red-400' },
  ConvertedToPO: { label: 'PO létrehozva',   bg: 'bg-teal-50',     fg: 'text-teal-700',    dot: 'bg-teal-500' },
}

export const INV_STATUS_STYLE: Record<InvoiceStatus, { label: string; bg: string; fg: string; dot: string }> = {
  Received:  { label: 'Beérkezett',    bg: 'bg-sky-50',      fg: 'text-sky-700',     dot: 'bg-sky-400' },
  Matched:   { label: 'Egyeztetett',   bg: 'bg-indigo-50',   fg: 'text-indigo-700',  dot: 'bg-indigo-400' },
  Exception: { label: 'Eltérés',       bg: 'bg-amber-50',    fg: 'text-amber-700',   dot: 'bg-amber-400' },
  Approved:  { label: 'Jóváhagyva',    bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Disputed:  { label: 'Vitás',         bg: 'bg-red-50',      fg: 'text-red-600',     dot: 'bg-red-400' },
}

export const PL_STATUS_STYLE: Record<PriceListStatus, { label: string; bg: string; fg: string }> = {
  Draft:   { label: 'Vázlat',  bg: 'bg-stone-100',  fg: 'text-stone-600' },
  Active:  { label: 'Aktív',   bg: 'bg-emerald-50', fg: 'text-emerald-700' },
  Expired: { label: 'Lejárt',  bg: 'bg-stone-100',  fg: 'text-stone-400' },
}

export const MATCH_STYLE: Record<MatchStatus, { label: string; bg: string; fg: string }> = {
  OK:        { label: 'OK',              bg: 'bg-emerald-50',  fg: 'text-emerald-700' },
  Warning:   { label: 'Tolerancián bel.', bg: 'bg-amber-50',    fg: 'text-amber-700' },
  Exception: { label: 'Eltérés',         bg: 'bg-red-50',      fg: 'text-red-600' },
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const REQUISITIONS_FALLBACK: RequisitionDto[] = [
  { id: 'req-001', reqNumber: 'IGE-2026-041', materialCode: 'MAT-OAK-22', materialName: 'Tölgy bútorlap 22mm', quantity: 20, unit: 'lap', preferredSupplierName: 'Egger Faipari Kft.', status: 'Draft', submittedBy: 'Kovács P.', submittedAt: '2026-05-27', note: 'Q3 előkészítés' },
  { id: 'req-002', reqNumber: 'IGE-2026-040', materialCode: 'ACC-BLUM-110', materialName: 'CLIP top zsanér', quantity: 500, unit: 'db', status: 'Approved', submittedBy: 'Nagy J.', submittedAt: '2026-05-26' },
  { id: 'req-003', reqNumber: 'IGE-2026-039', materialCode: 'MAT-MDF-19W', materialName: 'MDF 19mm fehér', quantity: 40, unit: 'lap', status: 'Rejected', submittedBy: 'Tóth K.', submittedAt: '2026-05-24', note: 'Készleten van' },
  { id: 'req-004', reqNumber: 'IGE-2026-038', materialCode: 'EDGE-ABS-2T', materialName: 'ABS élzáró 2mm tölgy', quantity: 200, unit: 'fm', status: 'ConvertedToPO', submittedBy: 'Kovács P.', submittedAt: '2026-05-20' },
  { id: 'req-005', reqNumber: 'IGE-2026-037', materialCode: 'MAT-BEECH-18', materialName: 'Bükk 18mm nyers', quantity: 15, unit: 'lap', status: 'Approved', submittedBy: 'Szabó A.', submittedAt: '2026-05-19' },
]

const INV_LINES_1: InvoiceLineDto[] = [
  { id: 'il-1-1', materialName: 'Tölgy bútorlap 22mm', materialCode: 'MAT-OAK-22', qty: 20, unitPrice: 12_400, vatRate: 0.27, lineTotal: 248_000, poQty: 20, deliveredQty: 20, matchStatus: 'OK', variancePct: 0 },
  { id: 'il-1-2', materialName: 'ABS élzáró 2mm', materialCode: 'EDGE-ABS-2T', qty: 180, unitPrice: 680, vatRate: 0.27, lineTotal: 122_400, poQty: 200, deliveredQty: 195, matchStatus: 'Warning', variancePct: 2.5 },
]
const INV_LINES_2: InvoiceLineDto[] = [
  { id: 'il-2-1', materialName: 'CLIP top zsanér', materialCode: 'ACC-BLUM-110', qty: 500, unitPrice: 1_850, vatRate: 0.27, lineTotal: 925_000, poQty: 500, deliveredQty: 480, matchStatus: 'Exception', variancePct: 4.2 },
]
const INV_LINES_3: InvoiceLineDto[] = [
  { id: 'il-3-1', materialName: 'MDF 19mm fehér', materialCode: 'MAT-MDF-19W', qty: 40, unitPrice: 4_800, vatRate: 0.27, lineTotal: 192_000, poQty: 40, deliveredQty: 40, matchStatus: 'OK', variancePct: 0 },
]

function calcInv(lines: InvoiceLineDto[]) {
  const totalNet = lines.reduce((s, l) => s + l.lineTotal, 0)
  const totalVat = Math.round(totalNet * 0.27)
  return { totalNet, totalVat, totalGross: totalNet + totalVat }
}

export const INVOICES_FALLBACK: InvoiceDto[] = [
  { id: 'inv-001', invoiceNumber: 'SZ-2026-0441', supplierName: 'Egger Faipari Kft.', poReference: 'PO-2426-091', ...calcInv(INV_LINES_1), status: 'Matched', recordedBy: 'Kovács P.', invoiceDate: '2026-05-25', lines: INV_LINES_1 },
  { id: 'inv-002', invoiceNumber: 'SZ-2026-0440', supplierName: 'Blum Hungária', poReference: 'PO-2426-090', ...calcInv(INV_LINES_2), status: 'Exception', recordedBy: 'Nagy J.', invoiceDate: '2026-05-24', lines: INV_LINES_2 },
  { id: 'inv-003', invoiceNumber: 'SZ-2026-0439', supplierName: 'Kronospan HU Zrt.', poReference: 'PO-2426-089', ...calcInv(INV_LINES_3), status: 'Approved', recordedBy: 'Tóth K.', invoiceDate: '2026-05-22', lines: INV_LINES_3 },
]

const PL_ENTRIES_EGGER: PriceListEntryDto[] = [
  { id: 'ple-1-1', materialCode: 'MAT-OAK-22',   materialName: 'Tölgy bútorlap 22mm',  unitPrice: 12_400, currency: 'HUF', isBestPrice: true },
  { id: 'ple-1-2', materialCode: 'MAT-MDF-19W',  materialName: 'MDF 19mm fehér',        unitPrice: 4_800,  currency: 'HUF', isBestPrice: false },
  { id: 'ple-1-3', materialCode: 'MAT-BEECH-18', materialName: 'Bükk 18mm nyers',       unitPrice: 9_200,  currency: 'HUF', isBestPrice: true },
]
const PL_ENTRIES_KRONOSPAN: PriceListEntryDto[] = [
  { id: 'ple-2-1', materialCode: 'MAT-MDF-19W',  materialName: 'MDF 19mm fehér',        unitPrice: 4_600,  currency: 'HUF', isBestPrice: true },
  { id: 'ple-2-2', materialCode: 'MAT-OAK-22',   materialName: 'Tölgy bútorlap 22mm',  unitPrice: 13_200, currency: 'HUF', isBestPrice: false },
]

export const PRICELISTS_FALLBACK: PriceListDto[] = [
  { id: 'pl-001', listNumber: 'AL-2026-003', supplierName: 'Egger Faipari Kft.',   status: 'Active',  validFrom: '2026-04-01', validTo: '2026-09-30', entries: PL_ENTRIES_EGGER },
  { id: 'pl-002', listNumber: 'AL-2026-002', supplierName: 'Kronospan HU Zrt.',    status: 'Active',  validFrom: '2026-04-01', validTo: '2026-09-30', entries: PL_ENTRIES_KRONOSPAN },
  { id: 'pl-003', listNumber: 'AL-2025-007', supplierName: 'Egger Faipari Kft.',   status: 'Expired', validFrom: '2025-10-01', validTo: '2025-12-31', entries: [] },
  { id: 'pl-004', listNumber: 'AL-2026-004', supplierName: 'Falco Sopron Zrt.',    status: 'Draft',   validFrom: '2026-06-01', entries: [] },
]

export function getMockRequisitionDetail(id: string): RequisitionDto {
  return REQUISITIONS_FALLBACK.find((r) => r.id === id) ?? REQUISITIONS_FALLBACK[0]
}

export function getMockInvoiceDetail(id: string): InvoiceDto {
  return INVOICES_FALLBACK.find((i) => i.id === id) ?? INVOICES_FALLBACK[0]
}

export function getMockPriceListDetail(id: string): PriceListDto {
  return PRICELISTS_FALLBACK.find((p) => p.id === id) ?? PRICELISTS_FALLBACK[0]
}

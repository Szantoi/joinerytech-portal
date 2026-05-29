import { ACTIVE_PO, SUPPLIERS } from '../mocks/data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type POStatus = 'Submitted' | 'Approved' | 'Shipping' | 'Delivered' | 'Cancelled'

export interface POLineDto {
  id: string
  materialName: string
  materialCode?: string
  quantity: number
  unit: string
  unitPrice: number
  lineTotal: number
}

export interface PODetailDto {
  id: string
  supplierName: string
  supplierId?: string
  status: POStatus
  totalAmount: number
  expectedDelivery: string
  confirmedDelivery?: string
  trackingNumber?: string
  note?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  lines: POLineDto[]
  createdAt: string
}

export interface SupplierDetailDto {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  leadTimeDays: number
  rating: number
  reliabilityPct: number
  lastOrderDate?: string
  activeOrderCount: number
  weeklyTrend: number[]  // 7 weeks reliability %
}

export interface NewPOForm {
  supplierId: string
  supplierName: string
  material: string
  quantity: number
  unit: string
  expectedDelivery: string
  note?: string
}

// ─── Status map ───────────────────────────────────────────────────────────────

export const PO_FSM_STEPS: Array<{ key: POStatus; label: string }> = [
  { key: 'Submitted', label: 'Leadva' },
  { key: 'Approved',  label: 'Visszaigazolva' },
  { key: 'Shipping',  label: 'Szállítás alatt' },
  { key: 'Delivered', label: 'Megérkezett' },
]

export const PO_STATUS_STYLE: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  Submitted: { label: 'Beküldve',        bg: 'bg-sky-50',      fg: 'text-sky-700',     dot: 'bg-sky-400' },
  Approved:  { label: 'Jóváhagyva',      bg: 'bg-indigo-50',   fg: 'text-indigo-700',  dot: 'bg-indigo-400' },
  Shipping:  { label: 'Szállítás alatt', bg: 'bg-amber-50',    fg: 'text-amber-700',   dot: 'bg-amber-400' },
  Delivered: { label: 'Megérkezett',     bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Cancelled: { label: 'Törölve',         bg: 'bg-red-50',      fg: 'text-red-600',     dot: 'bg-red-400' },
}

// ─── Mock generators ──────────────────────────────────────────────────────────

const MATERIAL_POOL = [
  { name: 'Tölgy bútorlap 22mm', code: 'MAT-OAK-22', unitPrice: 12_400, unit: 'lap' },
  { name: 'MDF 19mm fehér', code: 'MAT-MDF-19W', unitPrice: 4_800, unit: 'lap' },
  { name: 'Bükk 18mm nyers', code: 'MAT-BEECH-18', unitPrice: 9_200, unit: 'lap' },
  { name: 'CLIP top zsanér pár', code: 'ACC-BLUM-110', unitPrice: 1_850, unit: 'db' },
  { name: 'ABS élzáró 2mm tölgy (fm)', code: 'EDGE-ABS-2T', unitPrice: 680, unit: 'fm' },
]

export function getMockPOLines(orderId: string): POLineDto[] {
  const seed = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const count = (seed % 3) + 2
  return Array.from({ length: count }, (_, i) => {
    const m = MATERIAL_POOL[(seed + i * 3) % MATERIAL_POOL.length]
    const qty = ((seed + i * 7) % 18) + 3
    return {
      id: `poline-${orderId}-${i}`,
      materialName: m.name,
      materialCode: m.code,
      quantity: qty,
      unit: m.unit,
      unitPrice: m.unitPrice,
      lineTotal: qty * m.unitPrice,
    }
  })
}

export function getMockPODetail(orderId: string): PODetailDto {
  const found = ACTIVE_PO.find((p) => p.id === orderId)
  const lines = getMockPOLines(orderId)
  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0)
  const statusMap: Record<string, POStatus> = {
    running: 'Approved', planned: 'Submitted', done: 'Delivered', draft: 'Cancelled',
  }
  return {
    id: orderId,
    supplierName: found?.supplier ?? 'Egger Faipari Kft.',
    status: statusMap[found?.status ?? 'planned'] ?? 'Submitted',
    totalAmount: found ? found.qty * 10_000 : totalAmount,
    expectedDelivery: found?.eta ?? '2026-06-15',
    trackingNumber: found?.status === 'running' ? `HU-${orderId.slice(-6)}` : undefined,
    contactName: 'Értékesítési osztály',
    contactEmail: 'rend@supplier.hu',
    contactPhone: '+36 1 234 5678',
    lines,
    createdAt: '2026-05-10',
  }
}

export function getMockSupplierDetail(supplierName: string): SupplierDetailDto {
  const found = SUPPLIERS.find((s) => s.name === supplierName)
  const seed = supplierName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const weeklyTrend = Array.from({ length: 7 }, (_, i) =>
    Math.max(70, Math.min(100, (found?.reliability ?? 90) + ((seed + i * 3) % 11) - 5))
  )
  return {
    id: `sup-${seed}`,
    name: supplierName,
    email: `rend@${supplierName.toLowerCase().replace(/[^a-z]/g, '')}.hu`,
    phone: '+36 1 234 5678',
    address: `${found ? 'Ipari út 1.' : 'Fő utca 12.'}, ${supplierName}`,
    leadTimeDays: found ? 7 : 10,
    rating: found?.rating ?? 4.5,
    reliabilityPct: found?.reliability ?? 90,
    lastOrderDate: found?.lastOrder,
    activeOrderCount: (seed % 4) + 1,
    weeklyTrend,
  }
}

// Fallback supplier list for dropdowns (when API unavailable)
export const SUPPLIERS_FALLBACK: Array<{ id: string; name: string }> = SUPPLIERS.map((s, i) => ({
  id: `sup-fallback-${i + 1}`,
  name: s.name,
}))

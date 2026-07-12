// Raktár — lot, zóna, mozgás mock adatok

export type WzoneKey = 'general' | 'project_locked' | 'shop_reserved' | 'commissioned' | 'shippable'
export type WMovementType = 'Bevét' | 'Kivét' | 'Korr.' | 'Átvezetés'
export type WhTrend = 'ok' | 'low' | 'critical'

export const WH_ZONE_META: Record<WzoneKey, { label: string; short: string; pill: string; dot: string; bar: string; committed: boolean }> = {
  general:        { label: 'Általános',                   short: 'Szabad',       pill: 'bg-stone-100 text-stone-700 border-stone-200',      dot: 'bg-stone-400',   bar: 'bg-stone-400',   committed: false },
  project_locked: { label: 'Projekthez zárolt',           short: 'Zárolt',       pill: 'bg-violet-50 text-violet-700 border-violet-200',     dot: 'bg-violet-500',  bar: 'bg-violet-500',  committed: true },
  shop_reserved:  { label: 'Bolti rendeléshez foglalt',   short: 'Foglalt',      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',     dot: 'bg-indigo-500',  bar: 'bg-indigo-500',  committed: true },
  commissioned:   { label: 'Szállításhoz kommissiózva',   short: 'Kommissiózva', pill: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500',   bar: 'bg-amber-500',   committed: true },
  shippable:      { label: 'Szállítható',                 short: 'Szállítható',  pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500', bar: 'bg-emerald-500', committed: true },
}

export const WH_ZONE_ORDER: WzoneKey[] = ['general', 'project_locked', 'shop_reserved', 'commissioned', 'shippable']

export const WH_TREND_META: Record<WhTrend, { label: string; pill: string; dot: string }> = {
  ok:       { label: 'Rendben',  pill: 'bg-teal-50 text-teal-700 border-teal-200',    dot: 'bg-teal-500' },
  low:      { label: 'Alacsony', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  critical: { label: 'Kritikus', pill: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-500' },
}

export const WH_MOVEMENT_TONE: Record<WMovementType, { bg: string; fg: string; dot: string }> = {
  'Bevét':     { bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Kivét':     { bg: 'bg-stone-100',  fg: 'text-stone-700',   dot: 'bg-stone-400' },
  'Korr.':     { bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  'Átvezetés': { bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
}

export interface WhLot {
  id: string
  material: string
  matCode: string
  qty: number
  unit: string
  zone: WzoneKey
  location: string
  supplier: string
  receivedAt: string
  expiresAt: string | null
  projectRef: string | null
  trend: WhTrend
  minQty: number
}

export interface WhMovement {
  id: string
  date: string
  type: WMovementType
  lotId: string | null
  material: string
  qty: number
  unit: string
  who: string
  ref: string
  note: string
}

export const WH_LOTS: WhLot[] = [
  { id: 'LOT-2426-001', material: 'Bükk 18mm 2440×1830',        matCode: 'BK-18-2440', qty: 12,  unit: 'tábla',  zone: 'general',        location: 'A-01-03', supplier: 'Falco Sopron Zrt.', receivedAt: '2026-04-15', expiresAt: null,         projectRef: null,          trend: 'ok' as WhTrend,       minQty: 8  },
  { id: 'LOT-2426-002', material: 'Tölgy 22mm 2440×1830',        matCode: 'TL-22-2440', qty: 8,   unit: 'tábla',  zone: 'project_locked', location: 'A-02-01', supplier: 'Egger Faipari Kft.', receivedAt: '2026-04-23', expiresAt: null,         projectRef: 'PRJ-2026-014', trend: 'ok' as WhTrend,       minQty: 5  },
  { id: 'LOT-2426-003', material: 'MDF 19mm 2440×1830',          matCode: 'MDF-19-2440',qty: 4,   unit: 'tábla',  zone: 'general',        location: 'B-01-02', supplier: 'Kronospan HU Zrt.', receivedAt: '2026-04-04', expiresAt: null,         projectRef: null,          trend: 'low' as WhTrend,      minQty: 6  },
  { id: 'LOT-2426-004', material: 'Vasalat Blum CLIP top',       matCode: 'BL-CLIP-TOP',qty: 180, unit: 'db',     zone: 'general',        location: 'C-03-01', supplier: 'Blum Hungary Kft.', receivedAt: '2026-04-23', expiresAt: null,         projectRef: null,          trend: 'ok' as WhTrend,       minQty: 50 },
  { id: 'LOT-2426-005', material: 'ABS él 2mm tölgy',            matCode: 'ABS-2-TL',   qty: 80,  unit: 'fm',     zone: 'commissioned',   location: 'C-01-04', supplier: 'Döllken GmbH',       receivedAt: '2026-03-18', expiresAt: null,         projectRef: null,          trend: 'ok' as WhTrend,       minQty: 20 },
  { id: 'LOT-2426-006', material: 'Hettich fiókcsúszó 500mm',    matCode: 'HT-FCS-500', qty: 48,  unit: 'db',     zone: 'project_locked', location: 'C-02-02', supplier: 'Hettich Hungary',    receivedAt: '2026-04-11', expiresAt: null,         projectRef: 'PRJ-2026-013', trend: 'ok' as WhTrend,       minQty: 20 },
  { id: 'LOT-2426-007', material: 'Epoxy szürke LAK-147',        matCode: 'LAK-147-GY', qty: 3,   unit: 'liter',  zone: 'general',        location: 'D-01-01', supplier: 'Teknos Kft.',        receivedAt: '2026-02-10', expiresAt: '2026-08-10',   projectRef: null,          trend: 'critical' as WhTrend, minQty: 5  },
  { id: 'LOT-2426-008', material: 'Tölgy 40mm furnér (D1)',      matCode: 'TL-40-D1',   qty: 22,  unit: 'tábla',  zone: 'shippable',      location: 'A-03-01', supplier: 'Egger Faipari Kft.', receivedAt: '2026-04-20', expiresAt: null,         projectRef: 'JT-2426-0182', trend: 'ok' as WhTrend,       minQty: 5  },
]

export const WH_MOVEMENTS: WhMovement[] = [
  { id: 'MOV-0012', date: '2026-04-27 14:32', type: 'Kivét',     lotId: 'LOT-2426-001', material: 'Bükk 18mm 2440×1830',     qty: -8,   unit: 'tábla', who: 'Nagy J.',  ref: 'CP-184-A',   note: 'JT-2426-0184 · Bognár' },
  { id: 'MOV-0011', date: '2026-04-27 09:15', type: 'Bevét',     lotId: 'LOT-2426-003', material: 'MDF 19mm 2440×1830',       qty: +50,  unit: 'tábla', who: 'Raktár',  ref: 'PO-2426-088', note: 'Egger szállítás' },
  { id: 'MOV-0010', date: '2026-04-26 16:48', type: 'Átvezetés', lotId: 'LOT-2426-002', material: 'Tölgy 22mm 2440×1830',     qty: 0,    unit: 'tábla', who: 'Tóth K.', ref: 'PRJ-2026-014', note: 'project_locked → projektfoglalás megerősítve' },
  { id: 'MOV-0009', date: '2026-04-26 11:02', type: 'Kivét',     lotId: 'LOT-2426-008', material: 'Tölgy 40mm furnér',        qty: -22,  unit: 'tábla', who: 'Tóth K.', ref: 'CP-182-A',   note: 'JT-2426-0182 · Doorstar' },
  { id: 'MOV-0008', date: '2026-04-25 13:20', type: 'Bevét',     lotId: 'LOT-2426-002', material: 'Tölgy 22mm 2440×1830',     qty: +30,  unit: 'tábla', who: 'Raktár',  ref: 'PO-2426-091', note: 'Falco szállítás' },
  { id: 'MOV-0007', date: '2026-04-25 10:14', type: 'Kivét',     lotId: 'LOT-2426-003', material: 'MDF 19mm 2440×1830',       qty: -4,   unit: 'tábla', who: 'Kiss A.', ref: 'CP-181-B',   note: 'JT-2426-0181 · Várdai' },
  { id: 'MOV-0006', date: '2026-04-25 08:55', type: 'Korr.',     lotId: null,            material: 'Csavar Spax 4×40',         qty: -120, unit: 'db',    who: 'Szabó A.',ref: 'Leltár',     note: 'Heti leltár korrekció' },
  { id: 'MOV-0005', date: '2026-04-23 11:22', type: 'Bevét',     lotId: 'LOT-2426-004', material: 'Vasalat Blum CLIP top',    qty: +200, unit: 'db',    who: 'Raktár',  ref: 'PO-2426-087', note: 'Blum szállítás' },
  { id: 'MOV-0004', date: '2026-04-22 16:40', type: 'Kivét',     lotId: 'LOT-2426-001', material: 'Bükk 18mm 2440×1830',     qty: -5,   unit: 'tábla', who: 'Nagy J.', ref: 'CP-180-A',   note: 'JT-2426-0180 · Hegyi' },
  { id: 'MOV-0003', date: '2026-04-21 14:10', type: 'Bevét',     lotId: 'LOT-2426-006', material: 'Hettich fiókcsúszó 500mm', qty: +120, unit: 'db',    who: 'Raktár',  ref: 'PO-2426-086', note: 'Hettich szállítás' },
  { id: 'MOV-0002', date: '2026-04-20 10:30', type: 'Átvezetés', lotId: 'LOT-2426-005', material: 'ABS él 2mm tölgy',         qty: 0,    unit: 'fm',    who: 'Kiss A.', ref: 'JT-2426-0184', note: 'general → commissioned (szállítás-előkészítés)' },
  { id: 'MOV-0001', date: '2026-04-15 09:00', type: 'Bevét',     lotId: 'LOT-2426-001', material: 'Bükk 18mm 2440×1830',     qty: +20,  unit: 'tábla', who: 'Raktár',  ref: 'PO-2426-084', note: 'Falco szállítás' },
]

// ── Computed helpers ──────────────────────────────────────────────────────────

export function lotsByZone(): Record<WzoneKey, WhLot[]> {
  const result = {} as Record<WzoneKey, WhLot[]>
  for (const z of WH_ZONE_ORDER) result[z] = []
  for (const lot of WH_LOTS) result[lot.zone].push(lot)
  return result
}

export function whTrend(lot: WhLot): WhTrend {
  if (lot.qty <= 0) return 'critical'
  if (lot.qty < lot.minQty) return lot.qty <= lot.minQty / 2 ? 'critical' : 'low'
  return 'ok'
}

const TODAY = '2026-04-28'

export function expiresWithin30(lot: WhLot): boolean {
  if (!lot.expiresAt) return false
  const diff = (new Date(lot.expiresAt).getTime() - new Date(TODAY).getTime()) / 86400000
  return diff >= 0 && diff <= 30
}

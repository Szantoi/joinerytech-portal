// Belső tér világ — szoba-konfigurációk, bútor elemek

export type RoomStatus = 'draft' | 'designing' | 'approved' | 'finalized'
export type FurnitureType = 'wardrobe' | 'kitchen' | 'shelf' | 'table' | 'sofa' | 'bed' | 'desk' | 'cabinet'

export interface RoomConfig {
  id: string
  name: string
  project: string
  width: number
  depth: number
  height: number
  furnitureCount: number
  status: RoomStatus
  designer: string
  value: number
  createdAt: string
}

export interface FurnitureItem {
  id: string
  roomId: string
  type: FurnitureType
  name: string
  width: number
  depth: number
  height: number
  material: string
  color: string
  quantity: number
  unitPrice: number
}

export const ROOM_STATUS_META: Record<RoomStatus, { label: string; bg: string; fg: string; dot: string }> = {
  draft:     { label: 'Vázlat',        bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  designing: { label: 'Tervezés',      bg: 'bg-sky-50',      fg: 'text-sky-700',     dot: 'bg-sky-500' },
  approved:  { label: 'Jóváhagyva',    bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  finalized: { label: 'Véglegesített', bg: 'bg-violet-50',   fg: 'text-violet-700',  dot: 'bg-violet-500' },
}

export const FURNITURE_TYPE_META: Record<FurnitureType, { label: string; bg: string; fg: string }> = {
  wardrobe: { label: 'Gardrób',   bg: 'bg-violet-50',  fg: 'text-violet-700' },
  kitchen:  { label: 'Konyha',    bg: 'bg-amber-50',   fg: 'text-amber-700' },
  shelf:    { label: 'Polc',      bg: 'bg-stone-100',  fg: 'text-stone-700' },
  table:    { label: 'Asztal',    bg: 'bg-teal-50',    fg: 'text-teal-700' },
  sofa:     { label: 'Kanapé',    bg: 'bg-rose-50',    fg: 'text-rose-700' },
  bed:      { label: 'Ágy',       bg: 'bg-sky-50',     fg: 'text-sky-700' },
  desk:     { label: 'Íróasztal', bg: 'bg-indigo-50',  fg: 'text-indigo-700' },
  cabinet:  { label: 'Szekrény',  bg: 'bg-emerald-50', fg: 'text-emerald-700' },
}

export const ROOMS: RoomConfig[] = [
  { id: 'RM-001', name: 'Konyha + Nappali',   project: 'Vella Interior Design — Penthouse', width: 620, depth: 480, height: 270, furnitureCount: 4, status: 'designing', designer: 'Kovács P.', value: 4200000, createdAt: '2026-04-15' },
  { id: 'RM-002', name: 'Hálószoba',           project: 'Vella Interior Design — Penthouse', width: 380, depth: 340, height: 270, furnitureCount: 3, status: 'draft',     designer: 'Kovács P.', value: 2100000, createdAt: '2026-04-16' },
  { id: 'RM-003', name: 'Konyhabútor csomag',  project: 'Bognár Bútor Kft. — Q2 sorozat',   width: 540, depth: 260, height: 240, furnitureCount: 2, status: 'approved',  designer: 'Szabó A.',  value: 3600000, createdAt: '2026-04-10' },
  { id: 'RM-004', name: 'Dolgozószoba',        project: 'Hegyi Lakberendezés — Sopron',       width: 320, depth: 280, height: 255, furnitureCount: 1, status: 'finalized', designer: 'Szabó A.',  value: 860000,  createdAt: '2026-04-08' },
]

export const FURNITURE_ITEMS: FurnitureItem[] = [
  // RM-001 — Konyha + Nappali
  { id: 'FI-001', roomId: 'RM-001', type: 'kitchen',  name: 'Konyhai alsó sor (6 elem)',   width: 360, depth: 56,  height: 85,  material: 'Egger W1000 fehér 18mm', color: '#f5f5f0', quantity: 1, unitPrice: 540000 },
  { id: 'FI-002', roomId: 'RM-001', type: 'kitchen',  name: 'Konyhai felső sor (5 elem)',  width: 300, depth: 35,  height: 72,  material: 'Egger W1000 fehér 18mm', color: '#f5f5f0', quantity: 1, unitPrice: 380000 },
  { id: 'FI-003', roomId: 'RM-001', type: 'shelf',    name: 'Nappali polcfal',             width: 240, depth: 40,  height: 220, material: 'Egger H1334 tölgy 18mm', color: '#c8a882', quantity: 1, unitPrice: 280000 },
  { id: 'FI-004', roomId: 'RM-001', type: 'cabinet',  name: 'TV szekrény',                 width: 180, depth: 45,  height: 55,  material: 'Egger H1334 tölgy 18mm', color: '#c8a882', quantity: 1, unitPrice: 195000 },
  // RM-002 — Hálószoba
  { id: 'FI-005', roomId: 'RM-002', type: 'wardrobe', name: 'Gardrób szekrény 300cm',     width: 300, depth: 60,  height: 220, material: 'Egger W1000 fehér 18mm', color: '#f5f5f0', quantity: 1, unitPrice: 540000 },
  { id: 'FI-006', roomId: 'RM-002', type: 'bed',      name: 'Pántos ágykeret',            width: 180, depth: 210, height: 45,  material: 'Egger H1334 tölgy 18mm', color: '#c8a882', quantity: 1, unitPrice: 320000 },
  { id: 'FI-007', roomId: 'RM-002', type: 'desk',     name: 'Éjjeliszekrény (2db)',       width: 50,  depth: 40,  height: 55,  material: 'Egger H1334 tölgy 18mm', color: '#c8a882', quantity: 2, unitPrice: 95000 },
  // RM-003 — Konyhabútor csomag
  { id: 'FI-008', roomId: 'RM-003', type: 'kitchen',  name: 'Alsó szekrénysor (8 elem)',  width: 480, depth: 56,  height: 85,  material: 'Egger W1000 fehér 18mm', color: '#f5f5f0', quantity: 1, unitPrice: 720000 },
  { id: 'FI-009', roomId: 'RM-003', type: 'kitchen',  name: 'Felső szekrénysor (6 elem)', width: 360, depth: 35,  height: 72,  material: 'Egger W1000 fehér 18mm', color: '#f5f5f0', quantity: 1, unitPrice: 480000 },
  // RM-004 — Dolgozószoba
  { id: 'FI-010', roomId: 'RM-004', type: 'desk',     name: 'Íróasztal L-alakú',          width: 220, depth: 80,  height: 75,  material: 'Egger H1334 tölgy 18mm', color: '#c8a882', quantity: 1, unitPrice: 240000 },
]

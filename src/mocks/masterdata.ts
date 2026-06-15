// Törzsadatok világ — termékek, anyagok, szállítók

export type ProductStatus = 'active' | 'inactive' | 'review' | 'discontinued'
export type MaterialType = 'panel' | 'hardware' | 'paint' | 'edge' | 'accessory'
export type SupplierStatus = 'active' | 'inactive' | 'onboarding'

export interface MasterdataProduct {
  id: string
  code: string
  name: string
  category: string
  price: number
  unit: string
  status: ProductStatus
  stock: number
  minStock: number
}

export interface MasterdataMaterial {
  id: string
  code: string
  name: string
  type: MaterialType
  thickness?: number
  unit: string
  price: number
  stock: number
  supplier: string
}

export interface MasterdataSupplier {
  id: string
  name: string
  contact: string
  phone: string
  paymentTerm: number
  leadtime: number
  status: SupplierStatus
  category: string
}

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; bg: string; fg: string; dot: string }> = {
  active:       { label: 'Aktív',        bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:     { label: 'Inaktív',      bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  review:       { label: 'Felülvizsgálat', bg: 'bg-amber-50',  fg: 'text-amber-700',   dot: 'bg-amber-500' },
  discontinued: { label: 'Megszüntetett', bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
}

export const MATERIAL_TYPE_META: Record<MaterialType, { label: string; bg: string; fg: string }> = {
  panel:     { label: 'Lapanyag',  bg: 'bg-stone-100',   fg: 'text-stone-700' },
  hardware:  { label: 'Vasalat',   bg: 'bg-indigo-50',   fg: 'text-indigo-700' },
  paint:     { label: 'Festék',    bg: 'bg-rose-50',     fg: 'text-rose-700' },
  edge:      { label: 'Élzáró',    bg: 'bg-amber-50',    fg: 'text-amber-700' },
  accessory: { label: 'Kiegészítő', bg: 'bg-teal-50',    fg: 'text-teal-700' },
}

export const SUPPLIER_STATUS_META: Record<SupplierStatus, { label: string; bg: string; fg: string; dot: string }> = {
  active:     { label: 'Aktív',       bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:   { label: 'Inaktív',     bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
  onboarding: { label: 'Bevezetés',   bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
}

export const PRODUCTS: MasterdataProduct[] = [
  { id: 'PRD-001', code: 'BK-AJ-088', name: 'Bélelt belső ajtó 88cm', category: 'Ajtó',      price: 124000, unit: 'db', status: 'active',  stock: 12, minStock: 5 },
  { id: 'PRD-002', code: 'KNY-ALR-60', name: 'Konyhai alsó szekrény 60cm', category: 'Szekrény', price: 89000, unit: 'db', status: 'active',  stock: 8,  minStock: 3 },
  { id: 'PRD-003', code: 'KNY-FLS-60', name: 'Konyhai felső szekrény 60cm', category: 'Szekrény', price: 64000, unit: 'db', status: 'active',  stock: 10, minStock: 4 },
  { id: 'PRD-004', code: 'GRD-180-60', name: 'Gardrób szekrény 180×60cm', category: 'Gardrób',  price: 210000, unit: 'db', status: 'active',  stock: 4,  minStock: 2 },
  { id: 'PRD-005', code: 'PLF-120',   name: 'Polcrendszer modul 120cm',  category: 'Polc',     price: 38000, unit: 'db', status: 'active',  stock: 18, minStock: 6 },
  { id: 'PRD-006', code: 'FRD-FSZ-01', name: 'Fiókos részmegoldás 3-as', category: 'Fiók',     price: 52000, unit: 'szett', status: 'review',  stock: 0,  minStock: 2 },
  { id: 'PRD-007', code: 'BK-AJ-078', name: 'Bélelt belső ajtó 78cm', category: 'Ajtó',      price: 118000, unit: 'db', status: 'inactive', stock: 3,  minStock: 0 },
  { id: 'PRD-008', code: 'KNY-SAR-90', name: 'Sarokkonyha elem 90cm',   category: 'Szekrény', price: 145000, unit: 'db', status: 'active',  stock: 5,  minStock: 2 },
]

export const MATERIALS: MasterdataMaterial[] = [
  { id: 'MAT-001', code: 'EG-3303-18', name: 'Egger W1000 fehér 18mm',    type: 'panel',    thickness: 18, unit: 'tábla', price: 8200,  stock: 42,  supplier: 'Egger Faipari Kft.' },
  { id: 'MAT-002', code: 'EG-H1334-18', name: 'Egger H1334 tölgy 18mm',   type: 'panel',    thickness: 18, unit: 'tábla', price: 11800, stock: 18,  supplier: 'Egger Faipari Kft.' },
  { id: 'MAT-003', code: 'BL-CLIP-T', name: 'Blum CLIP top csukópánt',    type: 'hardware', unit: 'db',    price: 980,   stock: 220, supplier: 'Hettich Hungary' },
  { id: 'MAT-004', code: 'BL-TBX', name: 'Blum Tandembox fiók szett',     type: 'hardware', unit: 'szett', price: 5400,  stock: 14,  supplier: 'Hettich Hungary' },
  { id: 'MAT-005', code: 'ABS-22-TL', name: 'ABS élfólia 22mm tölgy',     type: 'edge',     unit: 'fm',    price: 180,   stock: 480, supplier: 'Falco Sopron Zrt.' },
  { id: 'MAT-006', code: 'FST-WH-1L', name: 'Fehér fedőfesték 1L',        type: 'paint',    unit: 'liter', price: 3200,  stock: 24,  supplier: 'Kronospan HU Zrt.' },
]

export const SUPPLIERS: MasterdataSupplier[] = [
  { id: 'SUP-001', name: 'Egger Faipari Kft.',  contact: 'Molnár Péter',   phone: '+36 99 544 100', paymentTerm: 30, leadtime: 5, status: 'active', category: 'Lapanyag' },
  { id: 'SUP-002', name: 'Hettich Hungary',     contact: 'Tóth Mariann',   phone: '+36 1 421 3300', paymentTerm: 14, leadtime: 7, status: 'active', category: 'Vasalat' },
  { id: 'SUP-003', name: 'Falco Sopron Zrt.',   contact: 'Kovács Erzsébet', phone: '+36 99 310 200', paymentTerm: 30, leadtime: 3, status: 'active', category: 'Lapanyag/Él' },
  { id: 'SUP-004', name: 'Kronospan HU Zrt.',   contact: 'Varga Lajos',    phone: '+36 94 501 100', paymentTerm: 45, leadtime: 8, status: 'onboarding', category: 'MDF/Lapanyag' },
]

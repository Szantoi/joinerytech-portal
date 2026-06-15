// B2B Shop world mock data
export type ShopProductCategory = 'konyha' | 'szekreny' | 'ajto' | 'tartozek'
export type ShopOrderStatus = 'feldolgozas' | 'visszaigazolt' | 'szallitas' | 'lezart'

export interface ShopProduct {
  id: string
  code: string
  name: string
  category: ShopProductCategory
  price: number
  unit: string
  stock: number  // units in stock
  minOrder: number
}

export interface CartItem {
  productId: string
  qty: number
}

export interface ShopOrder {
  id: string
  date: string
  status: ShopOrderStatus
  items: { productId: string; name: string; qty: number; unitPrice: number }[]
  totalNet: number
  note: string
  deliveryDate: string
}

export const SHOP_PRODUCT_CATEGORY_META: Record<ShopProductCategory, { label: string; bg: string; fg: string }> = {
  konyha:    { label: 'Konyha',    bg: 'bg-teal-50',   fg: 'text-teal-700' },
  szekreny:  { label: 'Szekrény', bg: 'bg-violet-50',  fg: 'text-violet-700' },
  ajto:      { label: 'Ajtó',     bg: 'bg-amber-50',   fg: 'text-amber-700' },
  tartozek:  { label: 'Tartozék', bg: 'bg-stone-100',  fg: 'text-stone-600' },
}

export const SHOP_ORDER_STATUS_META: Record<ShopOrderStatus, { label: string; bg: string; fg: string; dot: string }> = {
  feldolgozas:   { label: 'Feldolgozás',   bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  visszaigazolt: { label: 'Visszaigazolt', bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  szallitas:     { label: 'Szállítás',     bg: 'bg-violet-50',  fg: 'text-violet-700',  dot: 'bg-violet-500' },
  lezart:        { label: 'Lezárt',        bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'SP-001', code: 'KA-180-FH', name: 'Konyhai alsó szekrény 180cm', category: 'konyha',   price: 285000, unit: 'sor', stock: 4,  minOrder: 1 },
  { id: 'SP-002', code: 'KF-240-FH', name: 'Konyhai felső sor 240cm',     category: 'konyha',   price: 195000, unit: 'sor', stock: 3,  minOrder: 1 },
  { id: 'SP-003', code: 'KS-120-TO', name: 'Konyhasziget 120cm tölgy',    category: 'konyha',   price: 340000, unit: 'db',  stock: 2,  minOrder: 1 },
  { id: 'SP-004', code: 'SZ-200-FH', name: 'Szekrénysor 200cm fehér',     category: 'szekreny', price: 220000, unit: 'db',  stock: 6,  minOrder: 1 },
  { id: 'SP-005', code: 'SZ-250-TO', name: 'Szekrénysor 250cm tölgy',     category: 'szekreny', price: 260000, unit: 'db',  stock: 3,  minOrder: 1 },
  { id: 'SP-006', code: 'GA-200-FH', name: 'Gardrób 2 ajtós fehér',       category: 'szekreny', price: 185000, unit: 'db',  stock: 8,  minOrder: 1 },
  { id: 'SP-007', code: 'GA-300-DI', name: 'Gardrób 3 ajtós dió',         category: 'szekreny', price: 245000, unit: 'db',  stock: 5,  minOrder: 1 },
  { id: 'SP-008', code: 'AJ-90-FH',  name: 'Beltéri ajtó 90cm fehér',    category: 'ajto',     price: 95000,  unit: 'db',  stock: 12, minOrder: 2 },
  { id: 'SP-009', code: 'AJ-80-TO',  name: 'Beltéri ajtó 80cm tölgy',    category: 'ajto',     price: 115000, unit: 'db',  stock: 8,  minOrder: 2 },
  { id: 'SP-010', code: 'AJ-90-DI',  name: 'Beltéri ajtó 90cm diótok',   category: 'ajto',     price: 135000, unit: 'db',  stock: 6,  minOrder: 1 },
  { id: 'SP-011', code: 'BL-HE-500', name: 'Blum fiókcsúszó 500mm',       category: 'tartozek', price: 8500,   unit: 'pár', stock: 50, minOrder: 5 },
  { id: 'SP-012', code: 'HI-SG-01',  name: 'Hettich szoftbecsukó szett',  category: 'tartozek', price: 3200,   unit: 'szett', stock: 80, minOrder: 10 },
]

export const SHOP_CART: CartItem[] = [
  { productId: 'SP-001', qty: 2 },
  { productId: 'SP-004', qty: 1 },
  { productId: 'SP-011', qty: 10 },
]

export const SHOP_ORDERS: ShopOrder[] = [
  { id: 'SHO-2426-005', date: '2026-04-28', status: 'feldolgozas',
    items: [{ productId: 'SP-001', name: 'Konyhai alsó szekrény 180cm', qty: 3, unitPrice: 285000 }],
    totalNet: 855000, note: 'Sürgős — átadás 05-10 előtt', deliveryDate: '2026-05-08' },
  { id: 'SHO-2426-004', date: '2026-04-22', status: 'visszaigazolt',
    items: [{ productId: 'SP-008', name: 'Beltéri ajtó 90cm fehér', qty: 4, unitPrice: 95000 }, { productId: 'SP-011', name: 'Blum fiókcsúszó 500mm', qty: 20, unitPrice: 8500 }],
    totalNet: 550000, note: '', deliveryDate: '2026-05-05' },
  { id: 'SHO-2426-003', date: '2026-04-15', status: 'szallitas',
    items: [{ productId: 'SP-006', name: 'Gardrób 2 ajtós fehér', qty: 2, unitPrice: 185000 }],
    totalNet: 370000, note: 'DPD Express', deliveryDate: '2026-04-30' },
  { id: 'SHO-2426-002', date: '2026-04-10', status: 'lezart',
    items: [{ productId: 'SP-009', name: 'Beltéri ajtó 80cm tölgy', qty: 5, unitPrice: 115000 }],
    totalNet: 575000, note: '', deliveryDate: '2026-04-25' },
  { id: 'SHO-2426-001', date: '2026-04-01', status: 'lezart',
    items: [{ productId: 'SP-012', name: 'Hettich szoftbecsukó szett', qty: 20, unitPrice: 3200 }],
    totalNet: 64000, note: '', deliveryDate: '2026-04-12' },
]

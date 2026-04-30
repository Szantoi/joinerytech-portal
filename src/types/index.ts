export type OrderStatus = 'draft' | 'calc' | 'ready' | 'released' | 'planned' | 'running' | 'done' | 'low' | 'ok' | 'critical'
export type OrderType = 'door' | 'cabinet' | 'window' | 'custom'
export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer'
export type WorldKey = 'production' | 'sales' | 'design' | 'warehouse' | 'shopfloor' | 'settings'
export type TaskKind = 'cutting' | 'edgeband' | 'cnc'
export type MachineState = 'running' | 'idle'
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
export type FlowPriority = 'high' | 'med' | 'low'
export type PermLevel = 'full' | 'read' | 'none'
export type PartnerType = 'manufacturer' | 'cutter' | 'trader' | 'supplier'

export interface Order {
  id: string
  customer: string
  type: OrderType
  date: string
  status: OrderStatus
  total: number
  items: number
}

export interface CuttingPlan {
  id: string
  order: string
  material: string
  sheets: number
  util: number
  status: OrderStatus
  machine: string
  operator: string
}

export interface Material {
  name: string
  code: string
  onHand: number
  min: number
  unit: string
  price: number
  trend: OrderStatus
}

export interface Supplier {
  name: string
  city: string
  rating: number
  reliability: number
  lastOrder: string
}

export interface ActivePO {
  id: string
  supplier: string
  material: string
  qty: number
  eta: string
  status: OrderStatus
}

export interface User {
  name: string
  email: string
  role: UserRole
  initials: string
}

export interface FlowEpic {
  id: string
  title: string
  customer: string
  type: OrderType
  stage: string
  due: string
  assignee: string
  priority: FlowPriority
  delegated: boolean
}

export interface Machine {
  id: string
  name: string
  kind: string
  facility: string
  operator: string
  state: MachineState
}

export interface ShopFloorTaskPart {
  name: string
  w?: number
  h?: number
  qty?: number
}

export interface ShopFloorTask {
  id: string
  kind: TaskKind
  order: string
  customer: string
  material?: string
  sheets: number
  currentSheet: number
  util?: number
  runtime: number
  parts: ShopFloorTaskPart[] | number
  edge?: string
  program?: string
}

export interface ShopFloorOperator {
  name: string
  pin: string
  initials: string
  machines: string[]
}

export interface WorldScreen {
  key: string
  hu: string
  en?: string
}

export interface World {
  key: WorldKey
  hu: string
  en: string
  sub: string
  icon: string
  accent: string
  screens: WorldScreen[]
  badge?: string
}

export interface Quote {
  id: string
  customer: string
  date: string
  expires: string
  value: number
  status: QuoteStatus
  items: number
  owner: string
}

export interface QuoteTone {
  bg: string
  fg: string
  dot: string
  label: string
}

export interface Customer {
  id: string
  name: string
  city: string
  contact: string
  email: string
  phone: string
  openOrders: number
  ltv: number
  since: string
}

export interface Stage {
  key: string
  hu: string
  en: string
  optional?: boolean
}

export interface Workstation {
  name: string
  type: string
  category: string
  status: string
  capacity: number
  lastService: string
  operators: string[]
}

export interface AuditEntry {
  ts: string
  actor: string
  event: string
  target: string
  hash: string
  verified: boolean
}

export interface Facility {
  id: string
  name: string
  address: string
  contactName: string
  contactPhone: string
  machines: number
  workers: number
  machinesList: string[]
}

export interface Partner {
  id: string
  name: string
  type: PartnerType
  status: string
  joined: string
  apiKey: string | null
  delegated: string[]
  sharedOrders: number
  contact: string
}

export interface PartnerInvite {
  email: string
  type: PartnerType
  sent: string
  state: string
}

export interface NestingPart {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  rot?: number
}

export interface NestingSheet {
  parts: NestingPart[]
  util: number
}

export interface ParamVar {
  key: string
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
  default: number | string
  kind: string
  options?: string[]
}

export interface ParamTemplate {
  id: string
  name: string
  type: string
  author: string
  version: string
  rating: number
  uses: number
  updated: string
  thumb: string
  note: string
  vars: ParamVar[]
  parts: Array<{
    name: string
    qty: number | string
    mat: string
    w: number | string
    h: number | string
    t: number | string
  }>
  constraints: Array<{ rule: string; expr: string }>
}

export interface Template {
  id: string
  name: string
  type: string
  paramCount: number
  rating: number
  downloads: number
  community: boolean
  params?: Array<{ name: string; val: number | string; unit: string }>
}

export interface PartnerTypes {
  hu: Record<PartnerType, string>
  en: Record<PartnerType, string>
}

export type PermModule = 'orders' | 'production' | 'inventory' | 'procurement' | 'analytics' | 'settings'

export type RoleMatrix = Record<UserRole, Record<PermModule, PermLevel>>

export interface CatalogLookupEntry {
  name: string
  t: number
  kind: string
  color: string
}

export interface I18nStrings {
  brand: string
  nav: Record<string, string>
  common: Record<string, string>
  dash: {
    greeting: string
    sub: string
    kpi: Record<string, string>
    vsLastWeek: string
    todayPlan: string
    recentOrders: string
    cuttingPlans: string
    sheets: string
    machinesActive: string
  }
  status: Record<string, string>
  orders: {
    title: string
    sub: string
    newOrder: string
    cols: Record<string, string>
    types: Record<string, string>
  }
  prod: {
    title: string
    tabs: Record<string, string>
    dailyPlan: string
    cuttingPlans: string
    nesting: string
    edgebanding: string
    cnc: string
    qc: string
    sheet: string
    utilization: string
    waste: string
    parts: string
  }
  inv: {
    title: string
    sub: string
    onHand: string
    reorder: string
    offcuts: string
    movements: string
  }
  proc: {
    title: string
    sub: string
    suppliers: string
    activePO: string
    newPO: string
    lastOrder: string
    rating: string
    reliability: string
  }
  ana: {
    title: string
    sub: string
    waste: string
    capacity: string
    oee: string
    daily: string
    export: string
  }
  set: {
    title: string
    tabs: Record<string, string>
    inviteUser: string
    role: Record<string, string>
  }
}

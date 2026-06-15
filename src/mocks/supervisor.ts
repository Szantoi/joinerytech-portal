export type WsState = 'idle' | 'working' | 'blocked' | 'break'

export interface Workstation {
  id: string
  name: string
  department: string
  operator?: string
  state: WsState
  currentTask?: string
  currentOrder?: string
  blockedReason?: string
  completedToday: number
  plannedToday: number
  utilization: number  // 0–1
}

export interface DayPlanItem {
  id: string
  order: string
  customer: string
  product: string
  qty: number
  doneQty: number
  workstation: string
  status: 'pending' | 'in_progress' | 'done' | 'blocked' | 'late'
}

export interface Alert {
  id: string
  kind: 'blocked' | 'late' | 'material' | 'quality'
  message: string
  workstation?: string
  order?: string
  severity: 'high' | 'medium' | 'low'
}

export const WS_STATE_META: Record<WsState, { label: string; pill: string; dot: string }> = {
  idle:    { label: 'Szabad',      pill: 'bg-stone-100 text-stone-600 border-stone-200',    dot: 'bg-stone-400' },
  working: { label: 'Dolgozik',    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  blocked: { label: 'Blokkolt',    pill: 'bg-rose-50 text-rose-700 border-rose-200',        dot: 'bg-rose-500' },
  break:   { label: 'Szünet',      pill: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-500' },
}

export const SUP_TODAY = '2026-04-28'

export const WORKSTATIONS: Workstation[] = [
  {
    id: 'ws-holzma', name: 'Holzma HPP380', department: 'Szabászat',
    operator: 'Nagy J.', state: 'working',
    currentTask: 'Bükk 18mm — Bognár tábla vágás (6/12)',
    currentOrder: 'JT-2426-0184',
    completedToday: 6, plannedToday: 12, utilization: 0.82,
  },
  {
    id: 'ws-biesse-edge', name: 'Homag KAL 310', department: 'Élzárás',
    operator: 'Kiss A.', state: 'working',
    currentTask: 'ABS 2mm élzárás — Hegyi gardrób elemek',
    currentOrder: 'JT-2426-0180',
    completedToday: 24, plannedToday: 40, utilization: 0.68,
  },
  {
    id: 'ws-rover', name: 'Biesse Rover CNC', department: 'CNC megmunkálás',
    operator: 'Tóth K.', state: 'blocked',
    currentTask: 'CNC program hiányzik — Bognár fiókfront',
    currentOrder: 'JT-2426-0184',
    blockedReason: 'CNC program feltöltés késő — IT várakozás',
    completedToday: 0, plannedToday: 8, utilization: 0.0,
  },
  {
    id: 'ws-assemb-1', name: 'Szerelőpad 1', department: 'Összeszerelés',
    operator: 'Horváth G.', state: 'working',
    currentTask: 'Doorstar beltéri ajtó — zsanér szerelés (3/8)',
    currentOrder: 'JT-2426-0182',
    completedToday: 3, plannedToday: 8, utilization: 0.75,
  },
  {
    id: 'ws-assemb-2', name: 'Szerelőpad 2', department: 'Összeszerelés',
    state: 'break',
    completedToday: 4, plannedToday: 10, utilization: 0.55,
  },
  {
    id: 'ws-qc', name: 'Minőségi ellenőrzés', department: 'QC',
    operator: 'Fekete P.', state: 'idle',
    completedToday: 0, plannedToday: 6, utilization: 0.0,
  },
]

export const DAY_PLAN: DayPlanItem[] = [
  { id: 'dp-1', order: 'JT-2426-0184', customer: 'Bognár Bútor Kft.', product: 'Konyhabútor alsó sor elem', qty: 16, doneQty: 6, workstation: 'Holzma HPP380', status: 'in_progress' },
  { id: 'dp-2', order: 'JT-2426-0184', customer: 'Bognár Bútor Kft.', product: 'Fiókfront CNC megmunkálás', qty: 8, doneQty: 0, workstation: 'Biesse Rover CNC', status: 'blocked' },
  { id: 'dp-3', order: 'JT-2426-0182', customer: 'Doorstar Hungary Zrt.', product: 'Beltéri ajtó zsanér szerelés', qty: 8, doneQty: 3, workstation: 'Szerelőpad 1', status: 'in_progress' },
  { id: 'dp-4', order: 'JT-2426-0180', customer: 'Hegyi Lakberendezés', product: 'Gardrób elem élzárás', qty: 40, doneQty: 24, workstation: 'Homag KAL 310', status: 'in_progress' },
  { id: 'dp-5', order: 'JT-2426-0179', customer: 'Pesti Ablakműhely', product: 'Polc lapszabász', qty: 20, doneQty: 0, workstation: 'Holzma HPP380', status: 'pending' },
  { id: 'dp-6', order: 'JT-2426-0182', customer: 'Doorstar Hungary Zrt.', product: 'Ajtókeret QC ellenőrzés', qty: 8, doneQty: 0, workstation: 'Minőségi ellenőrzés', status: 'pending' },
  { id: 'dp-7', order: 'JT-2426-0177', customer: 'Tóth Konyha & Társa', product: 'Konyhabútor szabászat', qty: 12, doneQty: 0, workstation: 'Holzma HPP380', status: 'late' },
  { id: 'dp-8', order: 'JT-2426-0180', customer: 'Hegyi Lakberendezés', product: 'Gardrób összeszerelés', qty: 6, doneQty: 4, workstation: 'Szerelőpad 2', status: 'in_progress' },
]

export const ALERTS: Alert[] = [
  { id: 'al-1', kind: 'blocked', message: 'CNC program feltöltés hiányzik — Biesse Rover leáll', workstation: 'Biesse Rover CNC', order: 'JT-2426-0184', severity: 'high' },
  { id: 'al-2', kind: 'late', message: 'Tóth Konyha szabászat 3 napja lejárt — határidő: 2026-04-25', order: 'JT-2426-0177', severity: 'high' },
  { id: 'al-3', kind: 'material', message: 'Fehér fényezett laminált — szállítói késés, 5 nap csúszás várható', severity: 'medium' },
  { id: 'al-4', kind: 'quality', message: 'Doorstar ajtókeret QC még nem kezdte el — ma kell befejezni', workstation: 'Minőségi ellenőrzés', order: 'JT-2426-0182', severity: 'medium' },
]

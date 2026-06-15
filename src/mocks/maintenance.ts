export type AssetStatus = 'ok' | 'warning' | 'down' | 'maintenance'
export type TicketType = 'preventive' | 'corrective' | 'emergency'
export type TicketStatus = 'open' | 'scheduled' | 'in_progress' | 'done' | 'deferred'

export interface MaintenanceAsset {
  id: string
  name: string
  kind: string
  status: AssetStatus
  location: string
  lastService: string
  nextService: string
  openTickets: number
}

export interface MaintenanceTicket {
  id: string
  assetId: string
  assetName: string
  type: TicketType
  status: TicketStatus
  priority: 'urgent' | 'high' | 'medium' | 'low'
  title: string
  reportedBy: string
  reportedAt: string
  dueDate: string
  note?: string
}

export interface ScheduledMaintenance {
  id: string
  assetId: string
  assetName: string
  date: string
  type: string
  assignee: string
  duration: number
}

export const ASSET_STATUS_META: Record<AssetStatus, { label: string; bg: string; fg: string; dot: string }> = {
  ok:          { label: 'Üzemel',         bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning:     { label: 'Figyelmeztetés', bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  down:        { label: 'Leállt',         bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  maintenance: { label: 'Karbantartás',   bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
}

export const TICKET_TYPE_META: Record<TicketType, { label: string; bg: string; fg: string }> = {
  preventive: { label: 'Megelőző',  bg: 'bg-sky-50',     fg: 'text-sky-700' },
  corrective: { label: 'Javítás',   bg: 'bg-amber-50',   fg: 'text-amber-700' },
  emergency:  { label: 'Sürgős',    bg: 'bg-rose-50',    fg: 'text-rose-700' },
}

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; bg: string; fg: string; dot: string }> = {
  open:        { label: 'Nyitott',       bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
  scheduled:   { label: 'Ütemezett',     bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  in_progress: { label: 'Folyamatban',   bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  done:        { label: 'Kész',          bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  deferred:    { label: 'Elhalasztva',   bg: 'bg-violet-50',  fg: 'text-violet-700',  dot: 'bg-violet-500' },
}

export const ASSETS: MaintenanceAsset[] = [
  { id: 'ASS-001', name: 'Holzma HPP380', kind: 'Szabászat', status: 'ok',
    location: 'Vác — főüzem / A csarnok', lastService: '2026-03-15', nextService: '2026-06-15', openTickets: 0 },
  { id: 'ASS-002', name: 'Biesse Rover CNC', kind: 'CNC megmunkáló', status: 'warning',
    location: 'Vác — főüzem / B csarnok', lastService: '2026-02-20', nextService: '2026-05-20', openTickets: 1 },
  { id: 'ASS-003', name: 'Homag KAL 310', kind: 'Élzárás', status: 'ok',
    location: 'Vác — főüzem / A csarnok', lastService: '2026-04-01', nextService: '2026-07-01', openTickets: 0 },
  { id: 'ASS-004', name: 'Biesse Selco WN6', kind: 'Szabászat', status: 'down',
    location: 'Vác — főüzem / A csarnok', lastService: '2026-01-10', nextService: '2026-04-10', openTickets: 2 },
  { id: 'ASS-005', name: 'Holzma CNC Sopron', kind: 'CNC megmunkáló', status: 'maintenance',
    location: 'Sopron telephely', lastService: '2026-04-20', nextService: '2026-07-20', openTickets: 1 },
  { id: 'ASS-006', name: 'Festő berendezés', kind: 'Felületkezelés', status: 'ok',
    location: 'Vác — főüzem / C csarnok', lastService: '2026-03-28', nextService: '2026-06-28', openTickets: 0 },
]

export const TICKETS: MaintenanceTicket[] = [
  { id: 'TKT-001', assetId: 'ASS-002', assetName: 'Biesse Rover CNC',
    type: 'corrective', status: 'open', priority: 'high',
    title: 'X-tengely vibráció — helyszíni vizsgálat szükséges',
    reportedBy: 'Kiss András', reportedAt: '2026-04-25', dueDate: '2026-05-02',
    note: 'Megmunkálás közben szabálytalan rezgés észlelhető az X-tengelyen.' },
  { id: 'TKT-002', assetId: 'ASS-004', assetName: 'Biesse Selco WN6',
    type: 'emergency', status: 'in_progress', priority: 'urgent',
    title: 'Fűrészlap törés — azonnali csere szükséges',
    reportedBy: 'Nagy János', reportedAt: '2026-04-27', dueDate: '2026-04-28',
    note: 'Leállt a gép, fűrészlap eltört. Csere készleten van.' },
  { id: 'TKT-003', assetId: 'ASS-004', assetName: 'Biesse Selco WN6',
    type: 'corrective', status: 'scheduled', priority: 'medium',
    title: 'Szorítófej kalibrálás',
    reportedBy: 'Tóth Kinga', reportedAt: '2026-04-22', dueDate: '2026-05-05' },
  { id: 'TKT-004', assetId: 'ASS-005', assetName: 'Holzma CNC Sopron',
    type: 'preventive', status: 'in_progress', priority: 'medium',
    title: 'Félév végi megelőző karbantartás',
    reportedBy: 'Rendszer', reportedAt: '2026-04-20', dueDate: '2026-04-30',
    note: 'Kenési pontok, szűrők, fogasszíj ellenőrzés.' },
  { id: 'TKT-005', assetId: 'ASS-001', assetName: 'Holzma HPP380',
    type: 'preventive', status: 'scheduled', priority: 'low',
    title: 'Negyedév végi megelőző karbantartás',
    reportedBy: 'Rendszer', reportedAt: '2026-04-26', dueDate: '2026-06-14' },
]

export const SCHEDULED: ScheduledMaintenance[] = [
  { id: 'SCH-001', assetId: 'ASS-004', assetName: 'Biesse Selco WN6',
    date: '2026-04-28', type: 'Vészjavítás — fűrészlap csere', assignee: 'Horváth Péter', duration: 2 },
  { id: 'SCH-002', assetId: 'ASS-005', assetName: 'Holzma CNC Sopron',
    date: '2026-04-30', type: 'Megelőző karbantartás', assignee: 'Varga László', duration: 4 },
  { id: 'SCH-003', assetId: 'ASS-004', assetName: 'Biesse Selco WN6',
    date: '2026-05-05', type: 'Szorítófej kalibrálás', assignee: 'Horváth Péter', duration: 1 },
  { id: 'SCH-004', assetId: 'ASS-001', assetName: 'Holzma HPP380',
    date: '2026-06-14', type: 'Negyedév végi megelőző', assignee: 'Varga László', duration: 3 },
]

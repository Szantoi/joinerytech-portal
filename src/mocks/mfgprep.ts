export type ReleaseStatus = 'pending' | 'approved' | 'in_production' | 'ready' | 'blocked'
export type DatasheetStatus = 'draft' | 'active' | 'completed' | 'on_hold'

export interface ReleaseItem {
  id: string
  orderId: string
  customer: string
  project: string
  productCount: number
  status: ReleaseStatus
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
  checklist: { label: string; done: boolean }[]
  materialNote?: string
}

export interface MfgDatasheet {
  id: string
  releaseId: string
  customer: string
  team: string
  status: DatasheetStatus
  startDate: string
  dueDate: string
  productCount: number
  operations: string[]
  note?: string
}

export const RELEASE_STATUS_META: Record<ReleaseStatus, { label: string; bg: string; fg: string; dot: string }> = {
  pending:      { label: 'Kiadásra vár',    bg: 'bg-stone-100',  fg: 'text-stone-600',  dot: 'bg-stone-400' },
  approved:     { label: 'Jóváhagyva',      bg: 'bg-sky-50',     fg: 'text-sky-700',    dot: 'bg-sky-500' },
  in_production:{ label: 'Gyártásban',      bg: 'bg-amber-50',   fg: 'text-amber-700',  dot: 'bg-amber-500' },
  ready:        { label: 'Beépítésre kész', bg: 'bg-emerald-50', fg: 'text-emerald-700',dot: 'bg-emerald-500' },
  blocked:      { label: 'Blokkolt',        bg: 'bg-rose-50',    fg: 'text-rose-700',   dot: 'bg-rose-500' },
}

export const DATASHEET_STATUS_META: Record<DatasheetStatus, { label: string; bg: string; fg: string; dot: string }> = {
  draft:    { label: 'Tervezet',    bg: 'bg-stone-100',  fg: 'text-stone-600',  dot: 'bg-stone-400' },
  active:   { label: 'Aktív',      bg: 'bg-orange-50',  fg: 'text-orange-700', dot: 'bg-orange-500' },
  completed:{ label: 'Kész',       bg: 'bg-emerald-50', fg: 'text-emerald-700',dot: 'bg-emerald-500' },
  on_hold:  { label: 'Várakozik',  bg: 'bg-amber-50',   fg: 'text-amber-700',  dot: 'bg-amber-500' },
}

export const MFGPREP_TODAY = '2026-04-28'

export const RELEASE_ITEMS: ReleaseItem[] = [
  {
    id: 'REL-2426-001', orderId: 'JT-2426-0184', customer: 'Bognár Bútor Kft.',
    project: 'Konyhabútor — 16 fiókos sor', productCount: 16, status: 'in_production',
    dueDate: '2026-05-10', priority: 'high', assignedTo: 'Beépítő csapat A',
    checklist: [
      { label: 'Anyaglista ellenőrzve', done: true },
      { label: 'Vágóterv jóváhagyva', done: true },
      { label: 'Élzárás ütemezve', done: true },
      { label: 'CNC program feltöltve', done: false },
    ],
    materialNote: 'Bükk 18mm — 12 tábla szükséges, készleten van',
  },
  {
    id: 'REL-2426-002', orderId: 'JT-2426-0182', customer: 'Doorstar Hungary Zrt.',
    project: '8 beltéri ajtó csomag', productCount: 8, status: 'approved',
    dueDate: '2026-05-02', priority: 'high', assignedTo: 'Ajtó csapat',
    checklist: [
      { label: 'Méretellenőrzés kész', done: true },
      { label: 'Anyag lefoglalva', done: true },
      { label: 'Gyártási sorrend rögzítve', done: false },
      { label: 'Minőségi check-lista megvan', done: false },
    ],
  },
  {
    id: 'REL-2426-003', orderId: 'JT-2426-0180', customer: 'Hegyi Lakberendezés',
    project: 'Gardrób + polcrendszer', productCount: 6, status: 'ready',
    dueDate: '2026-04-24', priority: 'medium', assignedTo: 'Szerelő brigád A',
    checklist: [
      { label: 'Anyaglista ellenőrzve', done: true },
      { label: 'Vágóterv jóváhagyva', done: true },
      { label: 'QC elvégezve', done: true },
      { label: 'Szállításra kész', done: true },
    ],
  },
  {
    id: 'REL-2426-004', orderId: 'JT-2426-0179', customer: 'Pesti Ablakműhely',
    project: 'Polcrendszer — irodai', productCount: 4, status: 'pending',
    dueDate: '2026-05-15', priority: 'low',
    checklist: [
      { label: 'Anyaglista ellenőrzve', done: false },
      { label: 'Vágóterv jóváhagyva', done: false },
      { label: 'Élzárás ütemezve', done: false },
    ],
    materialNote: 'Tölgy 22mm — rendelés szükséges',
  },
  {
    id: 'REL-2426-005', orderId: 'JT-2426-0177', customer: 'Tóth Konyha & Társa',
    project: 'Konyhabútor rekonstrukció', productCount: 12, status: 'blocked',
    dueDate: '2026-05-20', priority: 'high', assignedTo: 'Konyha csapat',
    checklist: [
      { label: 'Anyaglista ellenőrzve', done: true },
      { label: 'Vágóterv jóváhagyva', done: false },
      { label: 'Anyag lefoglalva', done: false },
    ],
    materialNote: 'Fehér fényezett laminált — szállítói késés',
  },
]

export const DATASHEETS: MfgDatasheet[] = [
  {
    id: 'DS-2426-001', releaseId: 'REL-2426-001', customer: 'Bognár Bútor Kft.',
    team: 'Szabászat + Élzárás', status: 'active',
    startDate: '2026-04-25', dueDate: '2026-05-08', productCount: 16,
    operations: ['cutting', 'edge', 'cnc', 'assembly'],
    note: 'CNC program feltöltés folyamatban',
  },
  {
    id: 'DS-2426-002', releaseId: 'REL-2426-002', customer: 'Doorstar Hungary Zrt.',
    team: 'Ajtó csapat', status: 'draft',
    startDate: '2026-04-29', dueDate: '2026-05-02', productCount: 8,
    operations: ['cutting', 'surface', 'qc'],
  },
  {
    id: 'DS-2426-003', releaseId: 'REL-2426-003', customer: 'Hegyi Lakberendezés',
    team: 'Szerelő brigád A', status: 'completed',
    startDate: '2026-04-18', dueDate: '2026-04-24', productCount: 6,
    operations: ['cutting', 'edge', 'assembly', 'qc'],
  },
  {
    id: 'DS-2426-004', releaseId: 'REL-2426-005', customer: 'Tóth Konyha & Társa',
    team: 'Konyha csapat', status: 'on_hold',
    startDate: '2026-05-10', dueDate: '2026-05-20', productCount: 12,
    operations: ['cutting', 'edge', 'cnc', 'assembly', 'surface'],
    note: 'Felfüggesztve — anyagkésés miatt',
  },
]

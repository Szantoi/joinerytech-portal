export type ProjectStatus = 'draft' | 'active' | 'install' | 'done' | 'on_hold'
export type TradeKey = 'viz' | 'aram' | 'szellozes' | 'gepeszet' | 'butor'
export type DepStatus = 'pending' | 'scheduled' | 'in_progress' | 'done' | 'blocked'

export interface ProjectDep {
  id: string
  trade: TradeKey
  label: string
  status: DepStatus
  blocksInstall: boolean
}

export interface ProjectItem {
  id: string
  name: string
  qty: number
  value: number
}

export interface Project {
  id: string
  name: string
  customer: string
  designer: string
  status: ProjectStatus
  installTarget: string
  margin: number
  items: ProjectItem[]
  dependencies: ProjectDep[]
  note?: string
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; bg: string; fg: string; dot: string }> = {
  draft:   { label: 'Vázlat',            bg: 'bg-stone-100',   fg: 'text-stone-600',   dot: 'bg-stone-400' },
  active:  { label: 'Folyamatban',       bg: 'bg-sky-50',      fg: 'text-sky-700',     dot: 'bg-sky-500' },
  install: { label: 'Beépítésre kész',   bg: 'bg-emerald-50',  fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  done:    { label: 'Lezárva',           bg: 'bg-stone-100',   fg: 'text-stone-500',   dot: 'bg-stone-400' },
  on_hold: { label: 'Felfüggesztve',     bg: 'bg-amber-50',    fg: 'text-amber-700',   dot: 'bg-amber-500' },
}

export const TRADE_META: Record<TradeKey, { label: string; tint: string; dot: string }> = {
  viz:       { label: 'Víz',            tint: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500' },
  aram:      { label: 'Áram',           tint: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  szellozes: { label: 'Szellőzés',      tint: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
  gepeszet:  { label: 'Gépészet',       tint: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  butor:     { label: 'Bútor beépítés', tint: 'bg-stone-200 text-stone-700',   dot: 'bg-stone-600' },
}

export const DEP_STATUS_META: Record<DepStatus, { label: string; tone: string; dot: string }> = {
  pending:     { label: 'Tervezett',   tone: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400' },
  scheduled:   { label: 'Ütemezett',  tone: 'bg-sky-50 text-sky-700',      dot: 'bg-sky-500' },
  in_progress: { label: 'Folyamatban',tone: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500' },
  done:        { label: 'Kész',       tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  blocked:     { label: 'Blokkolt',   tone: 'bg-rose-50 text-rose-700',    dot: 'bg-rose-500' },
}

export const PROJECTS: Project[] = [
  {
    id: 'PRJ-2426-001',
    name: 'Hegyi lakás — konyha + nappali bútor',
    customer: 'Hegyi Krisztina',
    designer: 'Szabó A.',
    status: 'active',
    installTarget: '2026-05-20',
    margin: 0.34,
    items: [
      { id: 'i1', name: 'Konyhabútor alsó sor (6 elem)', qty: 1, value: 1_260_000 },
      { id: 'i2', name: 'Konyhabútor felső sor (4 elem)', qty: 1, value: 840_000 },
      { id: 'i3', name: 'Nappali polcrendszer', qty: 1, value: 620_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'viz', label: 'Vízszerelés leadva', status: 'done', blocksInstall: true },
      { id: 'd2', trade: 'aram', label: 'Villamossági bekötés', status: 'in_progress', blocksInstall: true },
      { id: 'd3', trade: 'butor', label: 'Bútor beépítés', status: 'pending', blocksInstall: false },
    ],
    note: 'Ügyfél elérhető du. 14–18h között.',
  },
  {
    id: 'PRJ-2426-002',
    name: 'Doorstar showroom — ajtóbeépítés',
    customer: 'Doorstar Hungary Zrt.',
    designer: 'Kiss B.',
    status: 'install',
    installTarget: '2026-05-06',
    margin: 0.28,
    items: [
      { id: 'i1', name: 'Beltéri ajtó (8 db)', qty: 8, value: 2_400_000 },
      { id: 'i2', name: 'Küszöb + keret csomag', qty: 8, value: 320_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'aram', label: 'Villamossági csekk', status: 'done', blocksInstall: true },
      { id: 'd2', trade: 'butor', label: 'Beépítés ütemezve', status: 'scheduled', blocksInstall: false },
    ],
  },
  {
    id: 'PRJ-2426-003',
    name: 'Bognár iroda — recepciós bútor',
    customer: 'Bognár Bútor Kft.',
    designer: 'Szabó A.',
    status: 'active',
    installTarget: '2026-06-10',
    margin: 0.41,
    items: [
      { id: 'i1', name: 'Recepciós pult', qty: 1, value: 890_000 },
      { id: 'i2', name: 'Iroda polcrendszer', qty: 2, value: 480_000 },
      { id: 'i3', name: 'Tárgyaló asztal + szekrény', qty: 1, value: 740_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'szellozes', label: 'Légcsatorna áthelyezés', status: 'in_progress', blocksInstall: true },
      { id: 'd2', trade: 'gepeszet', label: 'Gépészeti engedély', status: 'blocked', blocksInstall: true },
      { id: 'd3', trade: 'butor', label: 'Bútor beépítés', status: 'pending', blocksInstall: false },
    ],
    note: 'Légcsatorna csúszás kockázat — gépész visszajelezte.',
  },
  {
    id: 'PRJ-2426-004',
    name: 'Várdai konyha — teljes rekonstrukció',
    customer: 'Várdai Konyhastúdió',
    designer: 'Kiss B.',
    status: 'draft',
    installTarget: '2026-07-15',
    margin: 0.37,
    items: [
      { id: 'i1', name: 'Konyhabútor (tervezés alatt)', qty: 1, value: 1_800_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'viz', label: 'Vízvezeték csere', status: 'pending', blocksInstall: true },
      { id: 'd2', trade: 'aram', label: 'Konnektor áthelyezés', status: 'pending', blocksInstall: true },
    ],
    note: 'Felmérés: 2026-05-04.',
  },
  {
    id: 'PRJ-2426-005',
    name: 'Pesti Ablakműhely — tárgyaló berendezés',
    customer: 'Pesti Ablakműhely',
    designer: 'Nagy J.',
    status: 'done',
    installTarget: '2026-04-15',
    margin: 0.31,
    items: [
      { id: 'i1', name: 'Tárgyaló polcrendszer', qty: 1, value: 560_000 },
      { id: 'i2', name: 'Fogadótér bútor', qty: 1, value: 380_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'butor', label: 'Beépítve és átadva', status: 'done', blocksInstall: false },
    ],
  },
  {
    id: 'PRJ-2426-006',
    name: 'Tóth konyha — egyedi gardrób',
    customer: 'Tóth Konyha & Társa',
    designer: 'Szabó A.',
    status: 'on_hold',
    installTarget: '2026-08-01',
    margin: 0.29,
    items: [
      { id: 'i1', name: 'Gardrób (4-ajtós)', qty: 1, value: 680_000 },
    ],
    dependencies: [
      { id: 'd1', trade: 'viz', label: 'Csővezeték szabad', status: 'pending', blocksInstall: true },
    ],
    note: 'Ügyfél halasztást kért — felújítás csúszik.',
  },
]

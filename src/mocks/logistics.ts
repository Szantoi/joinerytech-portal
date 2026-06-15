export type ShipStatus =
  | 'tervezett' | 'berakodva' | 'uton' | 'kiszallitva' | 'beszerelve' | 'atadva'
  | 'felveve' | 'beerkezett' | 'helyszinen' | 'kesz' | 'reklamacio' | 'torolve'

export type ShipType = 'delivery' | 'pickup' | 'survey'

export interface ShipDeficiency { text: string; sev: 'minor' | 'major' }
export interface ShipHandover {
  signedBy: string
  signedAt: string
  photos: number
  deficiencies: ShipDeficiency[]
  protocol: boolean
}
export interface ShipLogEntry { at: string; text: string }

export interface Shipment {
  id: string
  type: ShipType
  status: ShipStatus
  install?: boolean
  customer: string
  address: string
  contact: string
  phone: string
  date: string
  windowStart?: string
  windowEnd?: string
  vehicleName?: string
  vehiclePlate?: string
  crewName?: string
  ref?: string
  refLabel?: string
  loadM3?: number
  loadKg?: number
  note?: string
  delegatedTo?: string
  handover: ShipHandover
  log: ShipLogEntry[]
}

export const SHIP_STATUS_META: Record<ShipStatus, { label: string; pill: string; dot: string }> = {
  tervezett:   { label: 'Tervezett',   pill: 'bg-stone-100 text-stone-700 border-stone-200',      dot: 'bg-stone-400' },
  berakodva:   { label: 'Berakodva',   pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',    dot: 'bg-indigo-500' },
  uton:        { label: 'Úton',        pill: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
  kiszallitva: { label: 'Kiszállítva', pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',          dot: 'bg-cyan-500' },
  beszerelve:  { label: 'Beszerelve',  pill: 'bg-teal-50 text-teal-700 border-teal-200',          dot: 'bg-teal-500' },
  atadva:      { label: 'Átadva',      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  felveve:     { label: 'Felvéve',     pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',          dot: 'bg-cyan-500' },
  beerkezett:  { label: 'Beérkezett',  pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  helyszinen:  { label: 'Helyszínen',  pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',          dot: 'bg-cyan-500' },
  kesz:        { label: 'Kész',        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  reklamacio:  { label: 'Reklamáció',  pill: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500' },
  torolve:     { label: 'Törölve',     pill: 'bg-stone-100 text-stone-400 border-stone-200',      dot: 'bg-stone-300' },
}

export const SHIP_TYPE_META: Record<ShipType, { label: string; short: string; pill: string; accent: string }> = {
  delivery: { label: 'Kiszállítás', short: 'Kisz.', pill: 'bg-sky-50 text-sky-700 border-sky-200',         accent: '#0284c7' },
  pickup:   { label: 'Beszállítás', short: 'Besz.', pill: 'bg-violet-50 text-violet-700 border-violet-200', accent: '#7c3aed' },
  survey:   { label: 'Felmérés',    short: 'Felm.', pill: 'bg-teal-50 text-teal-700 border-teal-200',       accent: '#0d9488' },
}

// FSM lépések típusonként
export const SHIP_STEPS: Record<ShipType, ShipStatus[]> = {
  delivery: ['tervezett', 'berakodva', 'uton', 'kiszallitva', 'beszerelve', 'atadva'],
  pickup:   ['tervezett', 'uton', 'felveve', 'beerkezett'],
  survey:   ['tervezett', 'uton', 'helyszinen', 'kesz'],
}

export const LOG_TODAY = '2026-04-28'

export const SHIPMENTS: Shipment[] = [
  {
    id: 'SH-2426-001', type: 'delivery', status: 'atadva', install: true,
    customer: 'Hegyi Lakberendezés', address: '9400 Sopron, Várkerület 18.', contact: 'Hegyi Krisztina', phone: '+36 99 312 444',
    date: '2026-04-24', windowStart: '08:00', windowEnd: '12:00',
    vehicleName: 'Mercedes Sprinter', vehiclePlate: 'LMN-204', crewName: 'Beépítő brigád A',
    ref: 'JT-2426-0180', refLabel: 'Hegyi Lakberendezés — gardrób', loadM3: 6, loadKg: 420, note: 'Emeleti lakás, lift van.',
    handover: { signedBy: 'Hegyi Krisztina', signedAt: '2026-04-24 11:40', photos: 3, deficiencies: [], protocol: true },
    log: [{ at: '2026-04-24 07:55', text: 'Berakodva (Vác — főüzem)' }, { at: '2026-04-24 11:40', text: 'Átadva, jegyzőkönyv aláírva' }],
  },
  {
    id: 'SH-2426-002', type: 'delivery', status: 'beszerelve', install: true,
    customer: 'Bognár Bútor Kft.', address: '7621 Pécs, Király u. 22.', contact: 'Bognár István', phone: '+36 72 412 333',
    date: '2026-04-28', windowStart: '09:00', windowEnd: '13:00',
    vehicleName: 'MAN TGL platós', vehiclePlate: 'KRT-887', crewName: 'Beépítő brigád A',
    ref: 'JT-2426-0184', refLabel: 'Bognár — 16 fiókos konyhabútor', loadM3: 12, loadKg: 980, note: 'Daru nem kell, földszint.',
    handover: { signedBy: '', signedAt: '', photos: 2, deficiencies: [{ text: 'Egy fiókfront felülete karcos — csere ígérve.', sev: 'minor' }], protocol: false },
    log: [{ at: '2026-04-28 08:30', text: 'Berakodva' }, { at: '2026-04-28 10:05', text: 'Helyszínre érkezett' }, { at: '2026-04-28 12:20', text: 'Beszerelve' }],
  },
  {
    id: 'SH-2426-003', type: 'delivery', status: 'uton', install: false,
    customer: 'Pesti Ablakműhely', address: '1095 Budapest, Soroksári út 30.', contact: 'Pesti Tamás', phone: '+36 1 422 100',
    date: '2026-04-28', windowStart: '11:00', windowEnd: '14:00',
    vehicleName: 'MAN TGL platós', vehiclePlate: 'KRT-887', crewName: 'Beépítő brigád B',
    ref: 'JT-2426-0179', refLabel: 'Pesti Ablakműhely — polcrendszer', loadM3: 3, loadKg: 210,
    handover: { signedBy: '', signedAt: '', photos: 0, deficiencies: [], protocol: false },
    log: [{ at: '2026-04-28 10:40', text: 'Elindult (Vác — főüzem)' }],
  },
  {
    id: 'SH-2426-004', type: 'delivery', status: 'tervezett', install: true,
    customer: 'Doorstar Hungary Zrt.', address: '2600 Vác, Deák F. u. 5.', contact: 'Kis Zoltán', phone: '+36 27 123 456',
    date: '2026-05-06', windowStart: '08:00', windowEnd: '16:00',
    vehicleName: 'MAN TGL platós', vehiclePlate: 'KRT-887', crewName: 'Beépítő brigád B',
    ref: 'JT-2426-0182', refLabel: 'Doorstar — 8 beltéri ajtó', loadM3: 9, loadKg: 540, note: 'Két emelet, lift nincs — pluszidő.',
    handover: { signedBy: '', signedAt: '', photos: 0, deficiencies: [], protocol: false },
    log: [],
  },
  {
    id: 'SH-2426-005', type: 'pickup', status: 'uton',
    customer: 'Falco Sopron Zrt.', address: '9400 Sopron, Bánfalvi út 42.', contact: 'Áru-átvétel', phone: '+36 99 511 200',
    date: '2026-04-28', windowStart: '13:00', windowEnd: '15:00',
    vehicleName: 'Mercedes Sprinter', vehiclePlate: 'LMN-204', crewName: 'Beépítő brigád A',
    ref: 'PO-2426-093', refLabel: 'Bükk 18mm bútorlap — 50 tábla', loadM3: 18, loadKg: 1450, note: 'Saját fuvar — nem ők hozzák.',
    handover: { signedBy: '', signedAt: '', photos: 0, deficiencies: [], protocol: false },
    log: [{ at: '2026-04-28 12:10', text: 'Elindult a beszállítóhoz' }],
  },
  {
    id: 'SH-2426-006', type: 'survey', status: 'tervezett',
    customer: 'Várdai Konyhastúdió', address: '4025 Debrecen, Piac u. 51.', contact: 'Várdai Eszter', phone: '+36 52 234 124',
    date: '2026-05-04', windowStart: '10:00', windowEnd: '12:00',
    vehicleName: 'Ford Transit', vehiclePlate: 'BPX-541', crewName: 'Felmérő + sofőr',
    refLabel: 'Konyha felmérés — ajánlat előtt', loadM3: 0, loadKg: 0, note: 'Lézeres bemérés, fotódokumentáció.',
    handover: { signedBy: '', signedAt: '', photos: 0, deficiencies: [], protocol: false },
    log: [],
  },
  {
    id: 'SH-2426-007', type: 'delivery', status: 'tervezett', install: true,
    customer: 'Tóth Konyha & Társa', address: '6722 Szeged, Tisza Lajos krt. 9.', contact: 'Tóth Béla', phone: '+36 62 555 333',
    date: '2026-05-08', windowStart: '09:00', windowEnd: '15:00',
    ref: 'JT-2426-0177', refLabel: 'Tóth Konyha — konyhabútor', loadM3: 10, loadKg: 720,
    note: 'Távoli helyszín — kiadva fuvarpartnernek.', delegatedTo: 'Beépítő Csapat Kft.',
    handover: { signedBy: '', signedAt: '', photos: 0, deficiencies: [], protocol: false },
    log: [{ at: '2026-04-26 14:00', text: 'Kiadva: Beépítő Csapat Kft.' }],
  },
]

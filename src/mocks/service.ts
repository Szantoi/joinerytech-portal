// Reklamáció / Szerviz világ — mock adatok

export type SvcType = 'garancia' | 'hianypotlas' | 'karbantartas'
export type SvcStatus = 'bejelentve' | 'kivizsgalas' | 'utemezve' | 'javitas' | 'ellenorzes' | 'lezarva' | 'elutasitva'
export type SvcPriority = 'alacsony' | 'kozepes' | 'magas' | 'surgos'
export type SvcChannel = 'webshop' | 'internal' | 'logistics' | 'handover'
export type SvcResolution = 'helyszini' | 'csere' | 'behuzas' | 'beallitas'

export interface SvcTicket {
  id: string
  type: SvcType
  status: SvcStatus
  priority: SvcPriority
  customer: string
  contact: string
  phone: string
  address: string
  title: string
  desc: string
  ref: string
  refLabel: string
  channel: SvcChannel
  installedAt: string
  warrantyMonths: number
  resolution: SvcResolution | null
  reportedAt: string
  dueDate: string
  closedAt?: string
  log: Array<{ at: string; text: string }>
}

export interface SvcWarranty {
  id: string
  customer: string
  product: string
  ref: string
  installedAt: string
  warrantyMonths: number
  expiresAt: string
  status: 'active' | 'expiring' | 'expired'
}

export interface SvcVisit {
  id: string
  ticketId: string
  customer: string
  address: string
  date: string
  timeSlot: string
  technician: string
  type: SvcType
  status: 'planned' | 'confirmed' | 'done' | 'cancelled'
  note: string
}

export const SVC_TYPE_META: Record<SvcType, { label: string; short: string; icon: string; pill: string; accent: string }> = {
  garancia:    { label: 'Garanciális reklamáció',    short: 'Garancia',     icon: 'shield', pill: 'bg-rose-50 text-rose-700 border-rose-200',     accent: '#dc2626' },
  hianypotlas: { label: 'Hiánypótlás',               short: 'Hiánypótlás',  icon: 'alert',  pill: 'bg-amber-50 text-amber-700 border-amber-200',  accent: '#d97706' },
  karbantartas:{ label: 'Karbantartás / beállítás',  short: 'Karbantartás', icon: 'wrench', pill: 'bg-teal-50 text-teal-700 border-teal-200',     accent: '#0d9488' },
}

export const SVC_STATUS_META: Record<SvcStatus, { label: string; pill: string; dot: string }> = {
  bejelentve:  { label: 'Bejelentve',  pill: 'bg-stone-100 text-stone-700 border-stone-200',     dot: 'bg-stone-400' },
  kivizsgalas: { label: 'Kivizsgálás', pill: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-500' },
  utemezve:    { label: 'Ütemezve',    pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  javitas:     { label: 'Javítás',     pill: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
  ellenorzes:  { label: 'Ellenőrzés',  pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',         dot: 'bg-cyan-500' },
  lezarva:     { label: 'Lezárva',     pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  elutasitva:  { label: 'Elutasítva',  pill: 'bg-stone-200 text-stone-500 border-stone-300',     dot: 'bg-stone-400' },
}

export const SVC_PRIORITY_META: Record<SvcPriority, { label: string; slaDays: number; pill: string; dot: string }> = {
  alacsony: { label: 'Alacsony', slaDays: 14, pill: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' },
  kozepes:  { label: 'Közepes',  slaDays: 7,  pill: 'bg-sky-50 text-sky-700 border-sky-200',        dot: 'bg-sky-500' },
  magas:    { label: 'Magas',    slaDays: 3,  pill: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500' },
  surgos:   { label: 'Sürgős',   slaDays: 1,  pill: 'bg-rose-50 text-rose-700 border-rose-200',     dot: 'bg-rose-500' },
}

export const SVC_STATUS_ORDER: SvcStatus[] = ['bejelentve', 'kivizsgalas', 'utemezve', 'javitas', 'ellenorzes', 'lezarva']

export const SVC_VISIT_STATUS_META: Record<SvcVisit['status'], { label: string; pill: string }> = {
  planned:   { label: 'Tervezett',  pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  confirmed: { label: 'Megerősített', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  done:      { label: 'Teljesített', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Lemondva',   pill: 'bg-stone-100 text-stone-500 border-stone-200' },
}

export const SERVICE_TICKETS: SvcTicket[] = [
  {
    id: 'REK-2426-001', type: 'hianypotlas', status: 'utemezve', priority: 'magas',
    customer: 'Bognár Bútor Kft.', contact: 'Bognár István', phone: '+36 72 412 333',
    address: '7621 Pécs, Király u. 22.',
    title: 'Karcos fiókfront — csere',
    desc: 'Az átadáskor jelölt fiókfront felülete karcos, csere ígérve. Gyártási megrendelés folyamatban.',
    ref: 'JT-2426-0184', refLabel: '16-fiókos konyhabútor',
    channel: 'logistics', installedAt: '2026-04-28', warrantyMonths: 24, resolution: 'csere',
    reportedAt: '2026-04-28', dueDate: '2026-05-01',
    log: [
      { at: '2026-04-28 12:25', text: 'Jegy létrehozva a Logisztika hiánylistából (SH-2426-002)' },
      { at: '2026-04-29 09:10', text: 'Kivizsgálva → csere-front gyártása ütemezve' },
    ],
  },
  {
    id: 'REK-2426-002', type: 'garancia', status: 'kivizsgalas', priority: 'kozepes',
    customer: 'Hegyi Lakberendezés', contact: 'Hegyi Krisztina', phone: '+36 99 312 444',
    address: '9400 Sopron, Várkerület 18.',
    title: 'Gardróbajtó nem zár rendesen',
    desc: 'A középső tolóajtó akad, nem fut végig a sínen. Garanciális bejelentés.',
    ref: 'JT-2426-0180', refLabel: 'Gardrób',
    channel: 'webshop', installedAt: '2026-04-24', warrantyMonths: 24, resolution: null,
    reportedAt: '2026-05-02', dueDate: '2026-05-09',
    log: [
      { at: '2026-05-02 16:40', text: 'Bejelentve a webshopból (ügyfél)' },
      { at: '2026-05-03 08:30', text: 'Kivizsgálás megkezdve — sín-állítás vagy görgő-csere' },
    ],
  },
  {
    id: 'REK-2426-003', type: 'karbantartas', status: 'bejelentve', priority: 'alacsony',
    customer: 'Nagy Anna', contact: 'Nagy Anna', phone: '+36 30 555 1212',
    address: '1124 Budapest, Petőfi u. 12.',
    title: 'Konyhaajtók utánállítása',
    desc: 'Néhány front rése elállt, kéri az utánállítást a beszokás után.',
    ref: 'PRJ-2026-014', refLabel: 'Petőfi u. 12. — Konyha + nappali',
    channel: 'internal', installedAt: '2026-04-20', warrantyMonths: 24, resolution: null,
    reportedAt: '2026-05-05', dueDate: '2026-05-19',
    log: [{ at: '2026-05-05 11:00', text: 'Telefonon bejelentve — diszpécser rögzítette' }],
  },
  {
    id: 'REK-2426-004', type: 'garancia', status: 'lezarva', priority: 'magas',
    customer: 'Belváros Café', contact: 'Kovács Dóra', phone: '+36 1 266 7788',
    address: '1052 Budapest, Váci u. 8.',
    title: 'Pult él-leválás',
    desc: 'A bárpult egyik élzárása levált a hőhatástól. Garanciális javítás elvégezve.',
    ref: 'PRJ-2026-013', refLabel: 'Belváros Café — pultsor',
    channel: 'internal', installedAt: '2026-03-15', warrantyMonths: 24, resolution: 'helyszini',
    reportedAt: '2026-04-10', dueDate: '2026-04-13', closedAt: '2026-04-16',
    log: [
      { at: '2026-04-10 09:00', text: 'Bejelentve (belső)' },
      { at: '2026-04-11', text: 'Helyszíni javítás ütemezve' },
      { at: '2026-04-15', text: 'Élzárás újraragasztva helyszínen' },
      { at: '2026-04-16', text: 'Ellenőrizve és lezárva' },
    ],
  },
  {
    id: 'REK-2426-005', type: 'garancia', status: 'elutasitva', priority: 'kozepes',
    customer: 'Tóth Konyha & Társa', contact: 'Tóth Béla', phone: '+36 62 555 333',
    address: '6722 Szeged, Tisza Lajos krt. 9.',
    title: 'Vetemedett munkalap',
    desc: 'A munkalap vetemedett — tartós átázás állapítva meg, nem rendeltetésszerű használat.',
    ref: 'JT-2426-0177', refLabel: 'Konyhabútor',
    channel: 'webshop', installedAt: '2025-11-20', warrantyMonths: 24, resolution: null,
    reportedAt: '2026-04-18', dueDate: '2026-04-25', closedAt: '2026-04-22',
    log: [
      { at: '2026-04-18', text: 'Bejelentve a webshopból' },
      { at: '2026-04-22', text: 'Kivizsgálva — tartós átázás, garancián kívüli. Elutasítva.' },
    ],
  },
  {
    id: 'REK-2426-006', type: 'garancia', status: 'utemezve', priority: 'surgos',
    customer: 'Doorstar Hungary Zrt.', contact: 'Kis Zoltán', phone: '+36 27 123 456',
    address: '2600 Vác, Ipari park 3.',
    title: 'Sorozat-ajtó pánt-törés (3 db)',
    desc: 'A legutóbbi szállítmányból 3 db ajtón a pánt sarkainál repedés. Üzemi kár, sürgős csere.',
    ref: 'JT-2426-0182', refLabel: 'Doorstar — 1. ütem ajtók',
    channel: 'internal', installedAt: '2026-04-18', warrantyMonths: 24, resolution: 'csere',
    reportedAt: '2026-04-26', dueDate: '2026-04-27',
    log: [
      { at: '2026-04-26 15:00', text: 'Sürgős bejelentés — gyári hibagyanú (pánt-rögzítés)' },
      { at: '2026-04-26 16:30', text: 'Ütemezve — csere-pántok + helyszíni szerelő' },
    ],
  },
]

export const SVC_WARRANTIES: SvcWarranty[] = [
  { id: 'WAR-001', customer: 'Bognár Bútor Kft.', product: '16-fiókos konyhabútor', ref: 'JT-2426-0184', installedAt: '2026-04-28', warrantyMonths: 24, expiresAt: '2028-04-28', status: 'active' },
  { id: 'WAR-002', customer: 'Hegyi Lakberendezés', product: 'Gardrób-sor (4 elem)', ref: 'JT-2426-0180', installedAt: '2026-04-24', warrantyMonths: 24, expiresAt: '2028-04-24', status: 'active' },
  { id: 'WAR-003', customer: 'Nagy Anna', product: 'Konyha + nappali bútor', ref: 'PRJ-2026-014', installedAt: '2026-04-20', warrantyMonths: 24, expiresAt: '2028-04-20', status: 'active' },
  { id: 'WAR-004', customer: 'Doorstar Hungary Zrt.', product: 'Belső ajtók 1. ütem', ref: 'JT-2426-0182', installedAt: '2026-04-18', warrantyMonths: 24, expiresAt: '2028-04-18', status: 'active' },
]

export const SVC_VISITS: SvcVisit[] = [
  { id: 'VIS-001', ticketId: 'REK-2426-001', customer: 'Bognár Bútor Kft.',     address: '7621 Pécs, Király u. 22.',     date: '2026-04-30', timeSlot: '09:00–12:00', technician: 'Kiss András',     type: 'hianypotlas',  status: 'confirmed', note: 'Csere-front helyszíni beépítése' },
  { id: 'VIS-002', ticketId: 'REK-2426-002', customer: 'Hegyi Lakberendezés',   address: '9400 Sopron, Várkerület 18.', date: '2026-05-03', timeSlot: '10:00–13:00', technician: 'Horváth Gábor',   type: 'garancia',     status: 'planned',   note: 'Tolóajtó sínjének ellenőrzése' },
  { id: 'VIS-003', ticketId: 'REK-2426-003', customer: 'Nagy Anna',             address: '1124 Budapest, Petőfi u. 12.',date: '2026-05-07', timeSlot: '13:00–15:00', technician: 'Horváth Gábor',   type: 'karbantartas', status: 'planned',   note: 'Konyhaajtó-fronok utánállítása' },
  { id: 'VIS-004', ticketId: 'REK-2426-006', customer: 'Doorstar Hungary Zrt.', address: '2600 Vác, Ipari park 3.',     date: '2026-04-28', timeSlot: '14:00–17:00', technician: 'Nagy János',      type: 'garancia',     status: 'confirmed', note: 'Pánt-csere — 3 db ajtó helyszínen' },
  { id: 'VIS-005', ticketId: 'REK-2426-004', customer: 'Belváros Café',         address: '1052 Budapest, Váci u. 8.',   date: '2026-04-15', timeSlot: '11:00–13:00', technician: 'Kiss András',     type: 'garancia',     status: 'done',      note: 'Élzárás újraragasztva, lezárva' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const SVC_TODAY = '2026-04-28'

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

export function svcSla(ticket: SvcTicket): { active: boolean; daysLeft: number; overdue: boolean } {
  const open = !['lezarva', 'elutasitva'].includes(ticket.status)
  if (!ticket.dueDate || !open) return { active: false, daysLeft: 0, overdue: false }
  const daysLeft = dayDiff(ticket.dueDate, SVC_TODAY)
  return { active: true, daysLeft, overdue: daysLeft < 0 }
}

export function svcWarranty(ticket: SvcTicket): { within: boolean; expiresAt: string; daysLeft: number } {
  const d = new Date(ticket.installedAt)
  d.setMonth(d.getMonth() + (ticket.warrantyMonths || 24))
  const expiresAt = d.toISOString().slice(0, 10)
  const daysLeft = dayDiff(expiresAt, SVC_TODAY)
  return { within: daysLeft >= 0, expiresAt, daysLeft }
}

export function isOpenTicket(ticket: SvcTicket): boolean {
  return !['lezarva', 'elutasitva'].includes(ticket.status)
}

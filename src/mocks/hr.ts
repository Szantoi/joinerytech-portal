// HR / MUNKAERŐ-KAPACITÁS világ — mock adatok

export type HrDeptKey = 'gyartas' | 'szereles' | 'logisztika' | 'tervezes' | 'ertekesites' | 'iroda'
export type HrPayGrade = 'seged' | 'szakmunkas' | 'mester' | 'mernok' | 'vezeto'
export type HrSkillKey = 'szabas' | 'elzaras' | 'cnc' | 'osszeszereles' | 'felulet' | 'szerel' | 'szallit' | 'felmer' | 'tervezes' | 'ertekesites'
export type AbsType = 'szabadsag' | 'betegseg' | 'fizetes_nelkuli' | 'egyeb'
export type AbsStatus = 'kert' | 'jovahagyva' | 'folyamatban' | 'lezarva' | 'elutasitva'

export interface HrSkill {
  key: HrSkillKey
  level: 1 | 2 | 3
}

export interface HrPersonal {
  children?: number
  maritalStatus?: string
  birthDate?: string
  birthPlace?: string
  motherName?: string
  nationality?: string
  address?: string
  taj?: string
  taxId?: string
  idCard?: string
  bankAccount?: string
  emergencyName?: string
  emergencyPhone?: string
  birthName?: string
  privPhone?: string
  privEmail?: string
}

export interface Employee {
  id: string
  name: string
  initials: string
  role: string
  dept: HrDeptKey
  facilityId: string
  payGrade: HrPayGrade
  weeklyHours: number
  employment: 'full' | 'part'
  phone: string
  email: string
  startedAt: string
  active: boolean
  color: string
  vacationBase?: number
  personal?: HrPersonal
  skills: HrSkill[]
}

export interface HrAbsence {
  id: string
  empId: string
  type: AbsType
  start: string
  end: string
  status: AbsStatus
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  reason: string
  days: number
  rejectReason?: string
  log: Array<{ at: string; text: string }>
}

export interface HrAssignment {
  id: string
  empId: string
  projectId: string | null
  projectName: string
  label: string
  start: string
  end: string
  hoursPerDay: number
  source: 'project' | 'task' | 'maintenance' | 'other'
}

export const HR_DEPT_META: Record<HrDeptKey, { label: string; icon: string; pill: string; accent: string }> = {
  gyartas:     { label: 'Gyártás / műhely',    icon: 'factory',   pill: 'bg-teal-50 text-teal-700 border-teal-200',     accent: '#0d9488' },
  szereles:    { label: 'Szerelés / beépítés', icon: 'wrench',    pill: 'bg-amber-50 text-amber-700 border-amber-200',   accent: '#d97706' },
  logisztika:  { label: 'Logisztika',          icon: 'truck',     pill: 'bg-sky-50 text-sky-700 border-sky-200',         accent: '#0284c7' },
  tervezes:    { label: 'Tervezés',            icon: 'ruler',     pill: 'bg-violet-50 text-violet-700 border-violet-200', accent: '#7c3aed' },
  ertekesites: { label: 'Értékesítés',         icon: 'briefcase', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: '#4f46e5' },
  iroda:       { label: 'Iroda / admin',       icon: 'user',      pill: 'bg-stone-100 text-stone-600 border-stone-200',   accent: '#57534e' },
}

export const HR_DEPT_ORDER: HrDeptKey[] = ['gyartas', 'szereles', 'logisztika', 'tervezes', 'ertekesites', 'iroda']

export const HR_PAY_GRADE_META: Record<HrPayGrade, { label: string; rate: number }> = {
  seged:      { label: 'Segéd / betanított',  rate: 2600 },
  szakmunkas: { label: 'Szakmunkás',          rate: 3800 },
  mester:     { label: 'Mester / előmunkás',  rate: 5200 },
  mernok:     { label: 'Mérnök / tervező',    rate: 6400 },
  vezeto:     { label: 'Vezető',              rate: 8000 },
}

export const HR_SKILL_META: Record<HrSkillKey, { label: string }> = {
  szabas:        { label: 'Szabászat' },
  elzaras:       { label: 'Élzárás' },
  cnc:           { label: 'CNC' },
  osszeszereles: { label: 'Összeszerelés' },
  felulet:       { label: 'Felületkezelés' },
  szerel:        { label: 'Beépítés' },
  szallit:       { label: 'Szállítás' },
  felmer:        { label: 'Felmérés' },
  tervezes:      { label: 'Tervezés / CAD' },
  ertekesites:   { label: 'Értékesítés' },
}

export const HR_SKILL_LEVEL_META: Record<1 | 2 | 3, { label: string; short: string; pill: string }> = {
  1: { label: 'Alap',   short: '1', pill: 'bg-stone-100 text-stone-500 border-stone-200' },
  2: { label: 'Rutin',  short: '2', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { label: 'Mester', short: '3', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export const ABS_TYPE_META: Record<AbsType, { label: string; pill: string; accent: string }> = {
  szabadsag:        { label: 'Szabadság',          pill: 'bg-teal-50 text-teal-700 border-teal-200',    accent: '#0d9488' },
  betegseg:         { label: 'Betegszabadság',      pill: 'bg-rose-50 text-rose-700 border-rose-200',    accent: '#dc2626' },
  fizetes_nelkuli:  { label: 'Fizetés nélküli',     pill: 'bg-stone-100 text-stone-600 border-stone-200', accent: '#57534e' },
  egyeb:            { label: 'Egyéb távollét',       pill: 'bg-amber-50 text-amber-700 border-amber-200', accent: '#d97706' },
}

export const ABS_STATUS_META: Record<AbsStatus, { label: string; pill: string; dot: string }> = {
  kert:        { label: 'Kért',         pill: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
  jovahagyva:  { label: 'Jóváhagyva',   pill: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-500' },
  folyamatban: { label: 'Folyamatban',  pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  lezarva:     { label: 'Lezárva',      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  elutasitva:  { label: 'Elutasítva',   pill: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500' },
}

// Remotely blocking absences (count against capacity)
export const ABS_BLOCKING: AbsStatus[] = ['jovahagyva', 'folyamatban', 'lezarva']

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp-nagyj', name: 'Nagy János', initials: 'NJ',
    role: 'Beépítő vezető / sofőr', dept: 'szereles', facilityId: 'fac-vac',
    payGrade: 'mester', weeklyHours: 40, employment: 'full',
    phone: '+36 30 412 5511', email: 'nagy.janos@joinerytech.hu', startedAt: '2019-03-01',
    active: true, color: '#d97706', vacationBase: 22,
    skills: [{ key: 'szerel', level: 3 }, { key: 'szallit', level: 3 }, { key: 'osszeszereles', level: 2 }],
    personal: { children: 2, maritalStatus: 'hazas', birthDate: '1984-07-12', birthPlace: 'Vác', emergencyName: 'Nagy Júlia (feleség)', emergencyPhone: '+36 30 555 7788' },
  },
  {
    id: 'emp-kissa', name: 'Kiss András', initials: 'KA',
    role: 'Élzáró / CNC operátor', dept: 'gyartas', facilityId: 'fac-vac',
    payGrade: 'szakmunkas', weeklyHours: 40, employment: 'full',
    phone: '+36 30 553 2210', email: 'kiss.andras@joinerytech.hu', startedAt: '2021-06-14',
    active: true, color: '#0d9488',
    skills: [{ key: 'elzaras', level: 3 }, { key: 'cnc', level: 2 }, { key: 'szerel', level: 2 }],
  },
  {
    id: 'emp-tothk', name: 'Tóth Kinga', initials: 'TK',
    role: 'Szabász operátor', dept: 'gyartas', facilityId: 'fac-vac',
    payGrade: 'szakmunkas', weeklyHours: 40, employment: 'full',
    phone: '+36 30 221 7788', email: 'toth.kinga@joinerytech.hu', startedAt: '2020-09-01',
    active: true, color: '#0284c7',
    skills: [{ key: 'szabas', level: 3 }, { key: 'elzaras', level: 2 }, { key: 'szerel', level: 1 }],
  },
  {
    id: 'emp-horvg', name: 'Horváth Gábor', initials: 'HG',
    role: 'Beépítő szerelő', dept: 'szereles', facilityId: 'fac-vac',
    payGrade: 'szakmunkas', weeklyHours: 40, employment: 'full',
    phone: '+36 30 118 4402', email: 'horvath.gabor@joinerytech.hu', startedAt: '2022-02-07',
    active: true, color: '#7c3aed',
    skills: [{ key: 'szerel', level: 3 }, { key: 'osszeszereles', level: 3 }, { key: 'szallit', level: 2 }],
  },
  {
    id: 'emp-feketep', name: 'Fekete Péter', initials: 'FP',
    role: 'Felmérő / sofőr', dept: 'logisztika', facilityId: 'fac-bp',
    payGrade: 'szakmunkas', weeklyHours: 40, employment: 'full',
    phone: '+36 30 904 6633', email: 'fekete.peter@joinerytech.hu', startedAt: '2023-01-09',
    active: true, color: '#0284c7',
    skills: [{ key: 'felmer', level: 3 }, { key: 'szallit', level: 3 }],
  },
  {
    id: 'emp-horve', name: 'Horváth Éva', initials: 'HE',
    role: 'CNC operátor', dept: 'gyartas', facilityId: 'fac-szek',
    payGrade: 'szakmunkas', weeklyHours: 32, employment: 'part',
    phone: '+36 30 667 2231', email: 'horvath.eva@joinerytech.hu', startedAt: '2022-11-21',
    active: true, color: '#0d9488',
    skills: [{ key: 'cnc', level: 3 }, { key: 'szabas', level: 2 }],
  },
  {
    id: 'emp-szaboa', name: 'Szabó Anna', initials: 'SA',
    role: 'Értékesítő', dept: 'ertekesites', facilityId: 'fac-vac',
    payGrade: 'mernok', weeklyHours: 40, employment: 'full',
    phone: '+36 30 442 9100', email: 'szabo.anna@joinerytech.hu', startedAt: '2020-04-01',
    active: true, color: '#4f46e5', vacationBase: 21,
    skills: [{ key: 'ertekesites', level: 3 }, { key: 'tervezes', level: 1 }],
    personal: { children: 3, maritalStatus: 'hazas' },
  },
  {
    id: 'emp-kovacsp', name: 'Kovács Péter', initials: 'KP',
    role: 'Tervező / ügyvezető', dept: 'tervezes', facilityId: 'fac-vac',
    payGrade: 'vezeto', weeklyHours: 40, employment: 'full',
    phone: '+36 30 111 2233', email: 'kovacs.peter@joinerytech.hu', startedAt: '2017-01-02',
    active: true, color: '#7c3aed', vacationBase: 25,
    skills: [{ key: 'tervezes', level: 3 }, { key: 'ertekesites', level: 2 }],
    personal: { children: 2, maritalStatus: 'hazas' },
  },
  {
    id: 'emp-vargal', name: 'Varga László', initials: 'VL',
    role: 'Felületkezelő / lakkozó', dept: 'gyartas', facilityId: 'fac-vac',
    payGrade: 'szakmunkas', weeklyHours: 40, employment: 'full',
    phone: '+36 30 778 1245', email: 'varga.laszlo@joinerytech.hu', startedAt: '2021-10-04',
    active: true, color: '#0d9488',
    skills: [{ key: 'felulet', level: 3 }, { key: 'osszeszereles', level: 2 }],
  },
  {
    id: 'emp-balogm', name: 'Balogh Márk', initials: 'BM',
    role: 'Betanított segéd', dept: 'gyartas', facilityId: 'fac-vac',
    payGrade: 'seged', weeklyHours: 40, employment: 'full',
    phone: '+36 30 330 9981', email: 'balogh.mark@joinerytech.hu', startedAt: '2024-08-19',
    active: true, color: '#57534e',
    skills: [{ key: 'osszeszereles', level: 1 }, { key: 'elzaras', level: 1 }],
  },
]

export const ABSENCES: HrAbsence[] = [
  {
    id: 'ABS-2426-007', empId: 'emp-balogm', type: 'szabadsag',
    start: '2026-05-04', end: '2026-05-08', status: 'kert',
    requestedAt: '2026-04-22', reason: 'Tavaszi szabadság.', days: 5,
    log: [{ at: '2026-04-22 10:12', text: 'Kérelem beadva' }],
  },
  {
    id: 'ABS-2426-006', empId: 'emp-feketep', type: 'szabadsag',
    start: '2026-05-11', end: '2026-05-15', status: 'jovahagyva',
    requestedAt: '2026-04-15', approvedBy: 'Kovács Péter', approvedAt: '2026-04-16',
    reason: 'Családi program.', days: 5,
    log: [{ at: '2026-04-15 09:00', text: 'Kérelem beadva' }, { at: '2026-04-16 14:30', text: 'Jóváhagyva — Kovács Péter' }],
  },
  {
    id: 'ABS-2426-005', empId: 'emp-tothk', type: 'betegseg',
    start: '2026-04-28', end: '2026-04-29', status: 'folyamatban',
    requestedAt: '2026-04-28', approvedBy: 'Kovács Péter', approvedAt: '2026-04-28',
    reason: 'Táppénz — orvosi igazolás.', days: 2,
    log: [{ at: '2026-04-28 07:40', text: 'Bejelentve (telefon)' }, { at: '2026-04-28 08:05', text: 'Rögzítve, folyamatban' }],
  },
  {
    id: 'ABS-2426-004', empId: 'emp-horve', type: 'szabadsag',
    start: '2026-04-20', end: '2026-04-24', status: 'lezarva',
    requestedAt: '2026-04-01', approvedBy: 'Kovács Péter', approvedAt: '2026-04-02',
    reason: '', days: 5,
    log: [{ at: '2026-04-01 11:00', text: 'Kérelem beadva' }, { at: '2026-04-02 09:10', text: 'Jóváhagyva' }, { at: '2026-04-24 17:00', text: 'Lezárva' }],
  },
]

export const HR_ASSIGNMENTS: HrAssignment[] = [
  { id: 'asg-1', empId: 'emp-tothk',  projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha',     label: 'Korpusz szabászat',           start: '2026-04-27', end: '2026-04-30', hoursPerDay: 6, source: 'project' },
  { id: 'asg-2', empId: 'emp-kissa',  projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha',     label: 'Élzárás + fúrás',             start: '2026-04-29', end: '2026-05-04', hoursPerDay: 7, source: 'project' },
  { id: 'asg-3', empId: 'emp-horvg',  projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor',    label: 'Összeszerelés',               start: '2026-04-28', end: '2026-05-01', hoursPerDay: 8, source: 'project' },
  { id: 'asg-4', empId: 'emp-vargal', projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha',     label: 'Lakkozás / felület',          start: '2026-05-05', end: '2026-05-07', hoursPerDay: 6, source: 'project' },
  { id: 'asg-5', empId: 'emp-horve',  projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor',    label: 'CNC megmunkálás',             start: '2026-04-29', end: '2026-04-30', hoursPerDay: 6, source: 'project' },
  { id: 'asg-6', empId: 'emp-nagyj',  projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha',     label: 'Helyszíni beépítés-előkészítés', start: '2026-04-28', end: '2026-04-28', hoursPerDay: 6, source: 'project' },
]

// ── HR Engine — pure calculations ────────────────────────────────────────────
const HR_DAY_MS = 86400000

export function hrParse(d: string): Date {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export function hrFmt(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function isWorkday(dt: Date): boolean {
  const d = dt.getDay()
  return d >= 1 && d <= 5
}

export function mondayOf(dateStr: string): string {
  const dt = hrParse(dateStr)
  const dow = dt.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  return hrFmt(new Date(dt.getTime() + diff * HR_DAY_MS))
}

export function dayCapacity(emp: Employee): number {
  return Math.round((emp.weeklyHours || 40) / 5 * 10) / 10
}

function inRange(dateStr: string, start: string, end?: string): boolean {
  return dateStr >= start && dateStr <= (end || start)
}

export function absenceOn(empId: string, dateStr: string): HrAbsence | null {
  return ABSENCES.find((a) => a.empId === empId && ABS_BLOCKING.includes(a.status) && inRange(dateStr, a.start, a.end)) ?? null
}

export function assignmentHoursOn(empId: string, dateStr: string): number {
  return HR_ASSIGNMENTS
    .filter((a) => a.empId === empId && inRange(dateStr, a.start, a.end))
    .reduce((s, a) => s + (a.hoursPerDay || 0), 0)
}

export interface DayLoad {
  capacity: number
  load: number
  free: number
  over: boolean
  absence: HrAbsence | null
  workday: boolean
}

export function dayLoad(emp: Employee, dateStr: string): DayLoad {
  const dt = hrParse(dateStr)
  const workday = isWorkday(dt)
  const absence = absenceOn(emp.id, dateStr)
  if (!workday || absence) return { capacity: 0, load: 0, free: 0, over: false, absence, workday }
  const cap = dayCapacity(emp)
  const load = assignmentHoursOn(emp.id, dateStr)
  return { capacity: cap, load, free: Math.max(0, cap - load), over: load > cap + 0.01, absence: null, workday }
}

export function weekSummary(emp: Employee, mondayStr: string): { capacity: number; load: number; util: number } {
  const mon = hrParse(mondayStr)
  let cap = 0, load = 0
  for (let i = 0; i < 5; i++) {
    const ds = hrFmt(new Date(mon.getTime() + i * HR_DAY_MS))
    const d = dayLoad(emp, ds)
    cap += d.capacity
    load += d.load
  }
  return { capacity: cap, load, util: cap > 0 ? load / cap : 0 }
}

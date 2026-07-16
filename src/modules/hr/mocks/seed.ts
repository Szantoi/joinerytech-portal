import { EMPLOYEES, HR_PAY_GRADE_META } from '../../../mocks/hr'
import type { Employee } from '../services/employees'
import type { Absence } from '../services/absences'
import type { Assignment } from '../services/assignments'
import type { TimeLog } from '../services/timeLogs'
import { addDays, isWorkday, todayIso } from '../services/calc'

/**
 * HR mock seed — a dolgozó-törzs a meglévő statikus mockból (mocks/hr.ts)
 * jön (adat-újrahasznosítás, a CRM seed mintája); a DÁTUMOS adatok
 * (távollét, beosztás, munkaóra-napló) viszont a „mához" képest relatív
 * MUNKANAP-eltolással generáltak, így a kapacitás-rács és a dashboard
 * KPI-k minden futásnál determinisztikus szerkezetűek (hétvége-biztosan).
 */

/** A seed horgony-munkanapja: ma, ha munkanap; hétvégén a következő hétfő. */
export function seedAnchor(): string {
  const today = todayIso()
  if (isWorkday(today)) return today
  let d = today
  do d = addDays(d, 1)
  while (!isWorkday(d))
  return d
}

/** A horgonytól n MUNKANAPPAL eltolt nap (hétvégéket átugorja; n<0 = múlt). */
export function seedWorkday(n: number): string {
  let d = seedAnchor()
  const step = n >= 0 ? 1 : -1
  let left = Math.abs(n)
  while (left > 0) {
    d = addDays(d, step)
    if (isWorkday(d)) left--
  }
  return d
}

/** Stabil azonosítók állapot szerint — a tesztek ezekre hivatkoznak. */
export const HR_SEED_IDS = {
  // dolgozók (mocks/hr.ts EMPLOYEES)
  empOverloaded: 'emp-kissa',    // két átfedő beosztás → túlterhelt napok
  empAbsentToday: 'emp-tothk',   // folyamatban lévő táppénz a horgony-napon
  empRequesting: 'emp-balogm',   // nyitott (kert) kérelem gazdája
  empPartTime: 'emp-horve',      // 32 ó/hét → 6,4 ó/nap kapacitás

  absRequested: 'ABS-2426-101',  // kert
  absApproved: 'ABS-2426-102',   // jovahagyva
  absInProgress: 'ABS-2426-103', // folyamatban (a horgony-napot fedi)
  absCompleted: 'ABS-2426-104',  // lezarva (múlt hét)
  absRejected: 'ABS-2426-105',   // elutasitva

  timeLogPushable: 'TL-2426-003',
  timeLogPushed: 'TL-2426-001',
} as const

/** Dolgozó-törzs: a statikus mockból, a bérsáv órabérével kiegészítve. */
export function seedEmployees(): Employee[] {
  return EMPLOYEES.map((e) => ({
    id: e.id,
    name: e.name,
    initials: e.initials,
    role: e.role,
    dept: e.dept,
    payGrade: e.payGrade,
    hourlyRate: HR_PAY_GRADE_META[e.payGrade].rate,
    weeklyHours: e.weeklyHours,
    employment: e.employment,
    phone: e.phone,
    email: e.email,
    startedAt: e.startedAt,
    active: e.active,
    color: e.color,
    skills: e.skills.map((s) => ({ key: s.key, level: s.level })),
  }))
}

function empName(empId: string): string {
  return EMPLOYEES.find((e) => e.id === empId)?.name ?? empId
}

/** Öt távollét — státuszonként egy, a horgonyhoz igazított munkanapokkal. */
export function seedAbsences(): Absence[] {
  const wd = seedWorkday
  const mk = (
    a: Omit<Absence, 'empName' | 'log'> & { log: Absence['log'] },
  ): Absence => ({ ...a, empName: empName(a.empId) })

  return [
    mk({
      id: HR_SEED_IDS.absRequested, empId: HR_SEED_IDS.empRequesting, type: 'szabadsag',
      start: wd(4), end: wd(8), status: 'kert', requestedAt: wd(-2),
      reason: 'Tavaszi szabadság.', days: 5,
      log: [{ at: `${wd(-2)} 10:12`, text: 'Kérelem beadva' }],
    }),
    mk({
      id: HR_SEED_IDS.absApproved, empId: 'emp-feketep', type: 'szabadsag',
      start: wd(9), end: wd(13), status: 'jovahagyva', requestedAt: wd(-6),
      approvedBy: 'Kovács Péter', approvedAt: wd(-5),
      reason: 'Családi program.', days: 5,
      log: [
        { at: `${wd(-6)} 09:00`, text: 'Kérelem beadva' },
        { at: `${wd(-5)} 14:30`, text: 'Jóváhagyva — Kovács Péter' },
      ],
    }),
    mk({
      id: HR_SEED_IDS.absInProgress, empId: HR_SEED_IDS.empAbsentToday, type: 'betegseg',
      start: wd(0), end: wd(1), status: 'folyamatban', requestedAt: wd(0),
      approvedBy: 'Kovács Péter', approvedAt: wd(0),
      reason: 'Táppénz — orvosi igazolás.', days: 2,
      log: [
        { at: `${wd(0)} 07:40`, text: 'Bejelentve (telefon)' },
        { at: `${wd(0)} 08:05`, text: 'Rögzítve, folyamatban' },
      ],
    }),
    mk({
      id: HR_SEED_IDS.absCompleted, empId: HR_SEED_IDS.empPartTime, type: 'szabadsag',
      start: wd(-7), end: wd(-3), status: 'lezarva', requestedAt: wd(-12),
      approvedBy: 'Kovács Péter', approvedAt: wd(-11),
      reason: '', days: 5,
      log: [
        { at: `${wd(-12)} 11:00`, text: 'Kérelem beadva' },
        { at: `${wd(-11)} 09:10`, text: 'Jóváhagyva' },
        { at: `${wd(-3)} 17:00`, text: 'Lezárva' },
      ],
    }),
    mk({
      id: HR_SEED_IDS.absRejected, empId: 'emp-vargal', type: 'egyeb',
      start: wd(2), end: wd(2), status: 'elutasitva', requestedAt: wd(-1),
      reason: 'Magánügyi elfoglaltság.', days: 1,
      rejectReason: 'A lakkozási határidő miatt a nap nem adható ki.',
      log: [
        { at: `${wd(-1)} 08:20`, text: 'Kérelem beadva' },
        { at: `${wd(-1)} 15:45`, text: 'Elutasítva — Kovács Péter' },
      ],
    }),
  ]
}

/**
 * Beosztások — az empOverloaded dolgozónak KÉT átfedő beosztás jut
 * (7+4 ó/nap > 8 ó kapacitás) a hét elejétől: a túlterhelés-flag és a
 * dashboard „túlterheltek" KPI determinisztikusan előáll.
 */
export function seedAssignments(): Assignment[] {
  const wd = seedWorkday
  return [
    { id: 'asg-101', empId: HR_SEED_IDS.empAbsentToday, projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', label: 'Korpusz szabászat', start: wd(-1), end: wd(2), hoursPerDay: 6, source: 'project' },
    { id: 'asg-102', empId: HR_SEED_IDS.empOverloaded, projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', label: 'Élzárás + fúrás', start: wd(0), end: wd(3), hoursPerDay: 7, source: 'project' },
    { id: 'asg-103', empId: HR_SEED_IDS.empOverloaded, projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', label: 'CNC besegítés', start: wd(0), end: wd(2), hoursPerDay: 4, source: 'project' },
    { id: 'asg-104', empId: 'emp-horvg', projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', label: 'Összeszerelés', start: wd(0), end: wd(3), hoursPerDay: 8, source: 'project' },
    { id: 'asg-105', empId: 'emp-vargal', projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', label: 'Lakkozás / felület', start: wd(2), end: wd(4), hoursPerDay: 6, source: 'project' },
    { id: 'asg-106', empId: HR_SEED_IDS.empPartTime, projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', label: 'CNC megmunkálás', start: wd(1), end: wd(2), hoursPerDay: 6, source: 'project' },
    { id: 'asg-107', empId: 'emp-nagyj', projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', label: 'Helyszíni beépítés-előkészítés', start: wd(0), end: wd(0), hoursPerDay: 6, source: 'project' },
  ]
}

/** Munkaóra-napló — múltbeli munkanapok; kettő már átadva a Kontrollingnak. */
export function seedTimeLogs(): TimeLog[] {
  const wd = seedWorkday
  const mk = (t: Omit<TimeLog, 'empName'>): TimeLog => ({ ...t, empName: empName(t.empId) })
  return [
    mk({ id: 'TL-2426-001', empId: HR_SEED_IDS.empAbsentToday, projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', day: wd(-3), hours: 6, note: 'Szabásterv + lapszabás', pushedAt: `${wd(-2)} 08:00` }),
    mk({ id: 'TL-2426-002', empId: 'emp-horvg', projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', day: wd(-3), hours: 8, pushedAt: `${wd(-2)} 08:00` }),
    mk({ id: 'TL-2426-003', empId: HR_SEED_IDS.empOverloaded, projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', day: wd(-2), hours: 7, note: 'Élzárás', pushedAt: null }),
    mk({ id: 'TL-2426-004', empId: HR_SEED_IDS.empOverloaded, projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', day: wd(-1), hours: 4, pushedAt: null }),
    mk({ id: 'TL-2426-005', empId: 'emp-nagyj', projectId: 'PRJ-2026-014', projectName: 'Petőfi u. 12. — Konyha', day: wd(-1), hours: 6, note: 'Felmérés + előkészítés', pushedAt: null }),
    mk({ id: 'TL-2426-006', empId: 'emp-horvg', projectId: 'PRJ-2026-013', projectName: 'Belváros Café — pultsor', day: wd(-2), hours: 8, pushedAt: null }),
  ]
}

import { OVERLOAD_EPSILON, UTILIZATION_WARN_THRESHOLD, WORKDAYS_PER_WEEK } from './config'
import { isAbsenceBlocking, type AbsenceStatus } from './fsm'
import { addDays, parseDay } from '../../../services/dateUtils'

/**
 * calc — a HR backend kapacitás-számításának tükre, tiszta (tesztelhető)
 * függvényekként (a Kontrolling calc.ts / EHS validity.ts mintája).
 *
 * Forrás: src/hr Domain `CapacityCalculationService` szemantika:
 *  - napi kapacitás = heti óraszám / 5 munkanap,
 *  - lekötés = az adott napra eső beosztások óráinak összege,
 *  - túlterhelés = lekötés > kapacitás (+ε),
 *  - blokkoló távollét (jovahagyva/folyamatban/lezarva) → a nap kapacitása 0.
 *
 * Ugyanezt a modult futtatja a UI (megjelenítés) és az MSW mock
 * (a /capacity válasz kiszámítása) — egy igazságforrás.
 */

// ── Dátum-helperek — a közös services/dateUtils-ból (helyi idő, YYYY-MM-DD) ──
// Re-export, hogy a modul-API (services/hr) változatlan maradjon.

export { parseDay, formatDay, addDays, todayIso } from '../../../services/dateUtils'

export function isWorkday(iso: string): boolean {
  const dow = parseDay(iso).getDay()
  return dow >= 1 && dow <= 5
}

/** Az adott napot tartalmazó hét hétfője. */
export function mondayOf(iso: string): string {
  const dow = parseDay(iso).getDay()
  return addDays(iso, dow === 0 ? -6 : 1 - dow)
}

/**
 * Az „aktuális kapacitás-hét" hétfője: munkanapon a saját hét, hétvégén a
 * KÖVETKEZŐ hét (hétvégén nincs kapacitás — a rács a következő tervezhető
 * hetet mutassa). A dashboard és a kapacitás-képernyő közös alapértelmezettje.
 */
export function capacityWeekOf(iso: string): string {
  return isWorkday(iso) ? mondayOf(iso) : mondayOf(addDays(iso, 7))
}

/** A hét 5 munkanapja (H–P) a hétfő kulcsából. */
export function weekDays(mondayIso: string): string[] {
  return Array.from({ length: WORKDAYS_PER_WEEK }, (_, i) => addDays(mondayIso, i))
}

// ── Kapacitás-számítás ──────────────────────────────────────────────────────

/** Strukturális bemenetek — a service- és a mock-típusok is megfelelnek nekik. */
export interface CapacityEmployeeInput {
  id: string
  weeklyHours: number
}

export interface CapacityAssignmentInput {
  empId: string
  start: string
  end: string
  hoursPerDay: number
}

export interface CapacityAbsenceInput {
  id: string
  empId: string
  type: string
  status: AbsenceStatus
  start: string
  end: string
}

/** Napi kapacitás (ó/nap, 0,1 pontossággal) a heti óraszámból. */
export function dayCapacity(weeklyHours: number): number {
  return Math.round((weeklyHours / WORKDAYS_PER_WEEK) * 10) / 10
}

function coversDay(start: string, end: string, day: string): boolean {
  return day >= start && day <= end
}

/** Az adott napra eső beosztás-órák összege. */
export function assignedHoursOn(
  assignments: CapacityAssignmentInput[],
  empId: string,
  day: string,
): number {
  return assignments
    .filter((a) => a.empId === empId && coversDay(a.start, a.end, day))
    .reduce((sum, a) => sum + a.hoursPerDay, 0)
}

/** A napot fedő, kapacitást blokkoló távollét (isAbsenceBlocking guard). */
export function blockingAbsenceOn(
  absences: CapacityAbsenceInput[],
  empId: string,
  day: string,
): CapacityAbsenceInput | null {
  return (
    absences.find(
      (a) => a.empId === empId && isAbsenceBlocking(a.status) && coversDay(a.start, a.end, day),
    ) ?? null
  )
}

/** Egy dolgozó egy napjának számított terhelésképe. */
export interface DayLoad {
  day: string
  workday: boolean
  capacity: number
  assigned: number
  free: number
  overloaded: boolean
  absence: { id: string; type: string } | null
}

export function calcDayLoad(
  employee: CapacityEmployeeInput,
  day: string,
  assignments: CapacityAssignmentInput[],
  absences: CapacityAbsenceInput[],
): DayLoad {
  const workday = isWorkday(day)
  const absence = workday ? blockingAbsenceOn(absences, employee.id, day) : null
  if (!workday || absence) {
    return {
      day, workday, capacity: 0, assigned: 0, free: 0, overloaded: false,
      absence: absence ? { id: absence.id, type: absence.type } : null,
    }
  }
  const capacity = dayCapacity(employee.weeklyHours)
  const assigned = assignedHoursOn(assignments, employee.id, day)
  return {
    day, workday, capacity, assigned,
    free: Math.max(0, capacity - assigned),
    overloaded: assigned > capacity + OVERLOAD_EPSILON,
    absence: null,
  }
}

/** Egy dolgozó heti összképe (5 munkanap). */
export interface EmployeeWeekCapacity {
  empId: string
  days: DayLoad[]
  capacity: number
  assigned: number
  /** lekötés / kapacitás; 0 kapacitásnál (végig távol) 0. */
  utilization: number
}

export function calcEmployeeWeek(
  employee: CapacityEmployeeInput,
  mondayIso: string,
  assignments: CapacityAssignmentInput[],
  absences: CapacityAbsenceInput[],
): EmployeeWeekCapacity {
  const days = weekDays(mondayIso).map((d) => calcDayLoad(employee, d, assignments, absences))
  const capacity = days.reduce((s, d) => s + d.capacity, 0)
  const assigned = days.reduce((s, d) => s + d.assigned, 0)
  return { empId: employee.id, days, capacity, assigned, utilization: capacity > 0 ? assigned / capacity : 0 }
}

/** A teljes heti rács (minden dolgozó) — az MSW /capacity válaszának magja. */
export function calcWeekCapacity(
  employees: CapacityEmployeeInput[],
  mondayIso: string,
  assignments: CapacityAssignmentInput[],
  absences: CapacityAbsenceInput[],
): EmployeeWeekCapacity[] {
  return employees.map((e) => calcEmployeeWeek(e, mondayIso, assignments, absences))
}

// ── Terhelés-sávok (címke/tónus a pages/hr/labels.ts-ben) ───────────────────

export type LoadBand = 'idle' | 'ok' | 'high' | 'over'

/** Nap/hét terhelés-sáv a konfigurált küszöbökkel (nem csak szín: címke is jár hozzá). */
export function loadBand(assigned: number, capacity: number): LoadBand {
  if (capacity <= 0 || assigned <= 0) return 'idle'
  if (assigned > capacity + OVERLOAD_EPSILON) return 'over'
  if (assigned / capacity > UTILIZATION_WARN_THRESHOLD) return 'high'
  return 'ok'
}

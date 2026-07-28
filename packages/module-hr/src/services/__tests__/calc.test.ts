import { describe, it, expect } from 'vitest'
import {
  addDays, mondayOf, isWorkday, weekDays, capacityWeekOf,
  dayCapacity, assignedHoursOn, blockingAbsenceOn, calcDayLoad,
  calcEmployeeWeek, calcWeekCapacity, loadBand,
  type CapacityAbsenceInput, type CapacityAssignmentInput, type CapacityEmployeeInput,
} from '../calc'

/**
 * calc.ts tiszta függvények — fix dátumokkal (2026-07-13 hétfő … 07-19
 * vasárnap), a backend CapacityCalculationService szemantikájának tükre.
 */

const MON = '2026-07-13' // hétfő
const emp: CapacityEmployeeInput = { id: 'e1', weeklyHours: 40 }
const partTime: CapacityEmployeeInput = { id: 'e2', weeklyHours: 32 }

describe('dátum-helperek', () => {
  it('mondayOf: hét közben és hétvégén is a saját hét hétfője', () => {
    expect(mondayOf('2026-07-15')).toBe(MON) // szerda
    expect(mondayOf('2026-07-19')).toBe(MON) // vasárnap
    expect(mondayOf(MON)).toBe(MON)
  })

  it('isWorkday: H–P igen, Szo–V nem', () => {
    expect(isWorkday(MON)).toBe(true)
    expect(isWorkday('2026-07-17')).toBe(true) // péntek
    expect(isWorkday('2026-07-18')).toBe(false) // szombat
    expect(isWorkday('2026-07-19')).toBe(false) // vasárnap
  })

  it('capacityWeekOf: munkanapon a saját hét, hétvégén a KÖVETKEZŐ hét', () => {
    expect(capacityWeekOf('2026-07-15')).toBe(MON)
    expect(capacityWeekOf('2026-07-18')).toBe('2026-07-20') // szombat → köv. hétfő
  })

  it('weekDays: a hét 5 munkanapja', () => {
    expect(weekDays(MON)).toEqual([
      '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17',
    ])
  })

  it('addDays hónap-határon át is jó', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31')
  })
})

describe('napi kapacitás és lekötés', () => {
  it('dayCapacity: heti óraszám / 5, 0,1 pontossággal', () => {
    expect(dayCapacity(40)).toBe(8)
    expect(dayCapacity(32)).toBe(6.4)
  })

  it('assignedHoursOn: a napot fedő beosztások óráinak összege', () => {
    const assignments: CapacityAssignmentInput[] = [
      { empId: 'e1', start: MON, end: '2026-07-15', hoursPerDay: 7 },
      { empId: 'e1', start: '2026-07-14', end: '2026-07-16', hoursPerDay: 4 },
      { empId: 'e2', start: MON, end: MON, hoursPerDay: 6 },
    ]
    expect(assignedHoursOn(assignments, 'e1', MON)).toBe(7)
    expect(assignedHoursOn(assignments, 'e1', '2026-07-14')).toBe(11) // átfedés: 7+4
    expect(assignedHoursOn(assignments, 'e1', '2026-07-17')).toBe(0)
  })

  it('blockingAbsenceOn: csak a blokkoló státuszú, napot fedő távollét', () => {
    const absences: CapacityAbsenceInput[] = [
      { id: 'a1', empId: 'e1', type: 'szabadsag', status: 'kert', start: MON, end: '2026-07-17' },
      { id: 'a2', empId: 'e1', type: 'betegseg', status: 'folyamatban', start: '2026-07-15', end: '2026-07-16' },
    ]
    expect(blockingAbsenceOn(absences, 'e1', MON)).toBeNull() // a kert nem blokkol
    expect(blockingAbsenceOn(absences, 'e1', '2026-07-15')?.id).toBe('a2')
    expect(blockingAbsenceOn(absences, 'e2', '2026-07-15')).toBeNull()
  })
})

describe('calcDayLoad / calcEmployeeWeek', () => {
  const assignments: CapacityAssignmentInput[] = [
    { empId: 'e1', start: MON, end: '2026-07-14', hoursPerDay: 7 },
    { empId: 'e1', start: '2026-07-14', end: '2026-07-14', hoursPerDay: 4 },
  ]
  const absences: CapacityAbsenceInput[] = [
    { id: 'a1', empId: 'e1', type: 'szabadsag', status: 'jovahagyva', start: '2026-07-16', end: '2026-07-17' },
  ]

  it('normál munkanap: kapacitás/lekötés/szabad, nincs túlterhelés 7/8-nál', () => {
    const d = calcDayLoad(emp, MON, assignments, absences)
    expect(d).toMatchObject({ workday: true, capacity: 8, assigned: 7, free: 1, overloaded: false, absence: null })
  })

  it('túlterhelt nap: 11 ó lekötés 8 ó kapacitáson', () => {
    const d = calcDayLoad(emp, '2026-07-14', assignments, absences)
    expect(d.assigned).toBe(11)
    expect(d.overloaded).toBe(true)
    expect(d.free).toBe(0) // nem negatív
  })

  it('blokkoló távollét: 0 kapacitás + távollét-jelölés', () => {
    const d = calcDayLoad(emp, '2026-07-16', assignments, absences)
    expect(d).toMatchObject({ capacity: 0, assigned: 0, overloaded: false })
    expect(d.absence).toEqual({ id: 'a1', type: 'szabadsag' })
  })

  it('hétvége: nem munkanap, 0 kapacitás, távollét sem jelölődik', () => {
    const d = calcDayLoad(emp, '2026-07-18', assignments, absences)
    expect(d).toMatchObject({ workday: false, capacity: 0, assigned: 0, absence: null })
  })

  it('heti összkép: kapacitás a távolléti napok nélkül, kihasználtság számított', () => {
    const w = calcEmployeeWeek(emp, MON, assignments, absences)
    expect(w.days).toHaveLength(5)
    expect(w.capacity).toBe(24) // 5×8 − 2 távolléti nap
    expect(w.assigned).toBe(18) // 7 + 11
    expect(w.utilization).toBeCloseTo(0.75)
  })

  it('teljes hét végig távol: 0 kapacitás → 0 kihasználtság (nincs osztás nullával)', () => {
    const fullAbsence: CapacityAbsenceInput[] = [
      { id: 'a9', empId: 'e1', type: 'betegseg', status: 'folyamatban', start: MON, end: '2026-07-17' },
    ]
    const w = calcEmployeeWeek(emp, MON, [], fullAbsence)
    expect(w.capacity).toBe(0)
    expect(w.utilization).toBe(0)
  })

  it('calcWeekCapacity: minden dolgozóra ad sort (részmunkaidős kapacitással)', () => {
    const rows = calcWeekCapacity([emp, partTime], MON, [], [])
    expect(rows).toHaveLength(2)
    expect(rows[1].capacity).toBe(32) // 5×6,4
  })
})

describe('loadBand küszöbök (config-vezérelt)', () => {
  it('idle / ok / high / over sávok', () => {
    expect(loadBand(0, 8)).toBe('idle')
    expect(loadBand(4, 0)).toBe('idle') // nincs kapacitás
    expect(loadBand(6, 8)).toBe('ok') // 75%
    expect(loadBand(7.2, 8)).toBe('high') // 90% > 85%
    expect(loadBand(9, 8)).toBe('over')
  })

  it('pontosan a kapacitáson lévő lekötés nem túlterhelés (epsilon)', () => {
    expect(loadBand(8, 8)).toBe('high') // 100% > 85%, de nem over
  })
})

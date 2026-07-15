import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { hrApiHandlers, resetHrDb, getHrDb, HR_SEED_IDS, seedWorkday } from '../../../mocks/hrApi'
import { fetchEmployee, fetchEmployees } from '../employees'
import { fetchAbsence, fetchAbsences, transitionAbsence } from '../absences'
import { fetchWeekCapacity } from '../capacity'
import { fetchAssignments } from '../assignments'
import { fetchTimeLogs, pushTimeLogsToControlling } from '../timeLogs'
import { addDays, mondayOf } from '../calc'
import { ApiError } from '../../apiClient'

/**
 * HR MSW kontraktus-tükör tesztek — állapottartó store + FSM guardok (409),
 * kötelező indok (400), számított kapacitás (calc.ts a mock alatt is).
 */

const server = setupServer(...hrApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetHrDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const IDS = HR_SEED_IDS

describe('dolgozók', () => {
  it('lista: 10 dolgozó névsorban; dept/q/skill szűrők szerver-oldaliak', async () => {
    const all = await fetchEmployees()
    expect(all).toHaveLength(10)
    expect(all.map((e) => e.name)).toEqual([...all.map((e) => e.name)].sort((a, b) => a.localeCompare(b, 'hu')))

    const gyartas = await fetchEmployees({ dept: 'gyartas' })
    expect(gyartas.length).toBeGreaterThan(0)
    expect(gyartas.every((e) => e.dept === 'gyartas')).toBe(true)

    const kinga = await fetchEmployees({ q: 'kinga' })
    expect(kinga).toHaveLength(1)
    expect(kinga[0].id).toBe(IDS.empAbsentToday)

    const cnc = await fetchEmployees({ skill: 'cnc' })
    expect(cnc.every((e) => e.skills.some((s) => s.key === 'cnc'))).toBe(true)
  })

  it('részlet + 404 ismeretlen azonosítóra', async () => {
    const emp = await fetchEmployee(IDS.empPartTime)
    expect(emp.weeklyHours).toBe(32)
    expect(emp.hourlyRate).toBeGreaterThan(0)

    const error = await fetchEmployee('emp-nincs').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

describe('távollét FSM-átmenetek', () => {
  it('lista: 5 seed-kérelem, státusz- és empId-szűrővel', async () => {
    expect(await fetchAbsences()).toHaveLength(5)
    const kert = await fetchAbsences({ status: 'kert' })
    expect(kert).toHaveLength(1)
    expect(kert[0].id).toBe(IDS.absRequested)
    const own = await fetchAbsences({ empId: IDS.empAbsentToday })
    expect(own).toHaveLength(1)
  })

  it('approve: kert → jovahagyva, jóváhagyó + napló rögzül, store perzisztál', async () => {
    const updated = await transitionAbsence(IDS.absRequested, 'approve', {})
    expect(updated.status).toBe('jovahagyva')
    expect(updated.approvedBy).toBe('Kovács Péter')
    expect(updated.log.at(-1)?.text).toContain('Jóváhagyva')
    // a store tényleg átállt (nem csak a válasz)
    expect((await fetchAbsence(IDS.absRequested)).status).toBe('jovahagyva')
  })

  it('tiltott átmenet → 409 a guard-üzenettel (jovahagyva nem approve-olható újra)', async () => {
    const error = await transitionAbsence(IDS.absApproved, 'approve', {}).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('Érvénytelen FSM-átmenet')
    // lezárt (terminális) kérelemre semmi nem hívható
    const done = await transitionAbsence(IDS.absCompleted, 'start', {}).catch((e: unknown) => e)
    expect((done as ApiError).status).toBe(409)
  })

  it('reject: indok nélkül 400, indokkal elutasitva + rejectReason', async () => {
    const bad = await transitionAbsence(IDS.absRequested, 'reject', { reason: '  ' }).catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)

    const rejected = await transitionAbsence(IDS.absRequested, 'reject', { reason: 'Határidős projekt.' })
    expect(rejected.status).toBe('elutasitva')
    expect(rejected.rejectReason).toBe('Határidős projekt.')
  })

  it('reopen: elutasitva → kert, az indok törlődik', async () => {
    const reopened = await transitionAbsence(IDS.absRejected, 'reopen', {})
    expect(reopened.status).toBe('kert')
    expect(reopened.rejectReason).toBeUndefined()
  })

  it('teljes lánc: approve → start → complete', async () => {
    await transitionAbsence(IDS.absRequested, 'approve', {})
    await transitionAbsence(IDS.absRequested, 'start', {})
    const done = await transitionAbsence(IDS.absRequested, 'complete', {})
    expect(done.status).toBe('lezarva')
  })

  it('ismeretlen távollét → 404', async () => {
    const error = await transitionAbsence('ABS-0000-000', 'approve', {}).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

describe('kapacitás (számított erőforrás)', () => {
  it('week validáció: nem-hétfő → 400', async () => {
    const tuesday = addDays(mondayOf(seedWorkday(0)), 1)
    const error = await fetchWeekCapacity(tuesday).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('a rács minden dolgozóra ad sort, a folyamatban lévő távollét 0 kapacitású napot ad', async () => {
    const week = mondayOf(seedWorkday(0))
    const grid = await fetchWeekCapacity(week)
    expect(grid.week).toBe(week)
    expect(grid.days).toHaveLength(5)
    expect(grid.rows).toHaveLength(10)

    // empAbsentToday: folyamatban lévő táppénz a horgony-napon → 0 kapacitás
    const absentRow = grid.rows.find((r) => r.empId === IDS.empAbsentToday)!
    const anchorDay = absentRow.days.find((d) => d.day === seedWorkday(0))!
    expect(anchorDay.capacity).toBe(0)
    expect(anchorDay.absence).not.toBeNull()

    // empOverloaded: átfedő beosztások (7+4 ó) → túlterhelt nap
    const overRow = grid.rows.find((r) => r.empId === IDS.empOverloaded)!
    expect(overRow.days.some((d) => d.overloaded)).toBe(true)
  })

  it('RULE-6 keresztkötés a kontraktusban: az approve után a kapacitás-rács változik', async () => {
    const absence = await fetchAbsence(IDS.absRequested)
    const week = mondayOf(absence.start)
    const before = await fetchWeekCapacity(week)
    const rowBefore = before.rows.find((r) => r.empId === absence.empId)!
    const dayBefore = rowBefore.days.find((d) => d.day === absence.start)!
    expect(dayBefore.capacity).toBeGreaterThan(0) // a kert még nem blokkol

    await transitionAbsence(absence.id, 'approve', {})

    const after = await fetchWeekCapacity(week)
    const rowAfter = after.rows.find((r) => r.empId === absence.empId)!
    const dayAfter = rowAfter.days.find((d) => d.day === absence.start)!
    expect(dayAfter.capacity).toBe(0) // a jóváhagyott távollét kiveszi a napot
    expect(dayAfter.absence?.id).toBe(absence.id)
  })

  it('beosztás-lista empId-szűrővel', async () => {
    const all = await fetchAssignments()
    expect(all.length).toBeGreaterThan(0)
    const own = await fetchAssignments({ empId: IDS.empOverloaded })
    expect(own).toHaveLength(2)
    expect(own.every((a) => a.empId === IDS.empOverloaded)).toBe(true)
  })
})

describe('munkaidő-napló', () => {
  it('lista (empId-szűrővel) + push: a nyitott tételek átadva jelölődnek', async () => {
    const before = await fetchTimeLogs()
    const openBefore = before.filter((t) => t.pushedAt === null)
    expect(openBefore.length).toBe(4)

    const result = await pushTimeLogsToControlling()
    expect(result.pushed).toBe(4)

    const after = await fetchTimeLogs()
    expect(after.every((t) => t.pushedAt !== null)).toBe(true)
    expect(getHrDb().timeLogs.every((t) => t.pushedAt !== null)).toBe(true)
  })

  it('empId-re szűkített push csak a dolgozó tételeit adja át', async () => {
    const result = await pushTimeLogsToControlling(IDS.empOverloaded)
    expect(result.pushed).toBe(2)
    const others = (await fetchTimeLogs()).filter((t) => t.empId !== IDS.empOverloaded)
    expect(others.some((t) => t.pushedAt === null)).toBe(true)
  })

  it('nincs átadható tétel → 409 (üzleti guard)', async () => {
    await pushTimeLogsToControlling()
    const error = await pushTimeLogsToControlling().catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })
})

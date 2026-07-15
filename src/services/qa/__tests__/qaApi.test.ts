import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import {
  qaApiHandlers, resetQaDb, getQaDb, QA_SEED_IDS,
} from '../../../mocks/qaApi'
import { fetchInspection, fetchInspections, transitionInspection } from '../inspections'
import {
  createTicket, escalateTicket, fetchTickets, transitionTicket,
} from '../tickets'
import { ApiError } from '../../apiClient'

/**
 * QA MSW kontraktus-tükör tesztek — állapottartó store + FSM guardok (409),
 * payload-guardok (400: hibajegyzet/intézkedés/indok/felelős), eszkaláció-
 * guardok (409), SZÁMÍTOTT blocking/openTickets (calc a mock alatt is) +
 * rule-6 keresztkötés a kontraktusban (hibajegy-mutáció → az átvizsgálás
 * openTickets mezője változik).
 */

const server = setupServer(...qaApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetQaDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const IDS = QA_SEED_IDS

describe('átvizsgálások — lista, szűrők, számított mezők', () => {
  it('lista: 8 seed-sor; status/open/q szűrők szerver-oldaliak', async () => {
    expect(await fetchInspections()).toHaveLength(8)

    const failed = await fetchInspections({ status: 'selejt' })
    expect(failed.map((i) => i.id).sort()).toEqual([IDS.inspFailedCritical, IDS.inspFailedMinor])

    const open = await fetchInspections({ open: true })
    expect(open.map((i) => i.id).sort()).toEqual([IDS.inspPlanned, IDS.inspInProgress].sort())

    const doorstar = await fetchInspections({ q: 'doorstar' })
    expect(doorstar).toHaveLength(1)
    expect(doorstar[0].id).toBe(IDS.inspInProgress)
  })

  it('blocking SZÁMÍTOTT: kritikus ponton selejt igen, enyhe ponton nem; 404 ismeretlen id-ra', async () => {
    const critical = await fetchInspection(IDS.inspFailedCritical)
    expect(critical.blocking).toBe(true)

    const minor = await fetchInspection(IDS.inspFailedMinor)
    expect(minor.blocking).toBe(false)

    const passed = await fetchInspection(IDS.inspPassed)
    expect(passed.blocking).toBe(false)

    const error = await fetchInspection('INSP-000').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('openTickets a nevesített nyitott-guard szerint számolt (kapcsolt hibajegyek)', async () => {
    // QAT-301 (bejelentve) kapcsolt az INSP-204-hez
    expect((await fetchInspection(IDS.inspFailedCritical)).openTickets).toBe(1)
    // QAT-303 (folyamatban) kapcsolt az INSP-205-höz
    expect((await fetchInspection(IDS.inspFailedMinor)).openTickets).toBe(1)
    expect((await fetchInspection(IDS.inspPassed)).openTickets).toBe(0)
  })
})

describe('átvizsgálás FSM-átmenetek', () => {
  it('start: nyitott → folyamatban; a store tényleg átáll', async () => {
    const started = await transitionInspection(IDS.inspPlanned, 'start', {})
    expect(started.status).toBe('folyamatban')
    expect(started.startedAt).not.toBeNull()
    expect((await fetchInspection(IDS.inspPlanned)).status).toBe('folyamatban')
  })

  it('pass: folyamatban → megfelelt megjegyzéssel; nyitott-ból 409', async () => {
    const blocked = await transitionInspection(IDS.inspPlanned, 'pass', {}).catch((e: unknown) => e)
    expect((blocked as ApiError).status).toBe(409)
    expect((blocked as ApiError).message).toContain('Érvénytelen FSM-átmenet')

    const passed = await transitionInspection(IDS.inspInProgress, 'pass', { notes: 'Rendben.' })
    expect(passed.status).toBe('megfelelt')
    expect(passed.notes).toBe('Rendben.')
    expect(passed.completedAt).not.toBeNull()
  })

  it('fail HIBAJEGYZET NÉLKÜL → 400 (CompleteWithFail aggregátum-guard); jegyzettel selejt + blocking újraszámol', async () => {
    const bad = await transitionInspection(IDS.inspInProgress, 'fail', { failureNotes: [] })
      .catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)
    expect((bad as ApiError).message).toContain('legalább egy hibajegyzet')

    const failed = await transitionInspection(IDS.inspInProgress, 'fail', {
      failureNotes: [{ failureType: 'meret', description: 'Ajtólap +2 mm' }],
    })
    expect(failed.status).toBe('selejt')
    expect(failed.failureNotes).toHaveLength(1)
    // az INSP-202 pontja „jelentos" → selejtre sem blokkol (calc-tükör)
    expect(failed.blocking).toBe(false)
  })

  it('terminális állapotból (megfelelt/selejt) semmi nem hívható — 409', async () => {
    const fromPassed = await transitionInspection(IDS.inspPassed, 'start', {}).catch((e: unknown) => e)
    expect((fromPassed as ApiError).status).toBe(409)

    const fromFailed = await transitionInspection(IDS.inspFailedCritical, 'pass', {})
      .catch((e: unknown) => e)
    expect((fromFailed as ApiError).status).toBe(409)
  })

  it('teljes lánc: start → fail (kritikus ponton) → blocking=true', async () => {
    await transitionInspection(IDS.inspPlanned, 'start', {})
    const failed = await transitionInspection(IDS.inspPlanned, 'fail', {
      failureNotes: [{ failureType: 'karc', description: 'Front-karc' }],
    })
    // az INSP-201 pontja kritikus → a selejt gyártás-blokkoló
    expect(failed.blocking).toBe(true)
  })
})

describe('hibajegyek — lista, szűrők, létrehozás', () => {
  it('lista: 6 seed-sor; status/priority/open/inspectionId szűrők szerver-oldaliak', async () => {
    expect(await fetchTickets()).toHaveLength(6)

    const critical = await fetchTickets({ priority: 'kritikus' })
    expect(critical.map((t) => t.id)).toEqual([IDS.ticketCritical])

    const open = await fetchTickets({ open: true })
    expect(open.map((t) => t.id).sort()).toEqual(
      [IDS.ticketCritical, IDS.ticketAssigned, IDS.ticketInProgress, IDS.ticketReported].sort(),
    )

    const linked = await fetchTickets({ inspectionId: IDS.inspFailedCritical })
    expect(linked.map((t) => t.id)).toEqual([IDS.ticketCritical])
  })

  it('létrehozás: bejelentve-ként indul, kapcsolt átvizsgálásra denormalizált ref; rövid cím/leírás → 400', async () => {
    const created = await createTicket({
      ticketType: 'javitas', priority: 'magas',
      title: 'Élzárás-hiba a front-soron',
      description: 'A selejt-átvizsgálás alapján javítandó élzárás-leválás.',
      inspectionId: IDS.inspFailedCritical,
    })
    expect(created.status).toBe('bejelentve')
    expect(created.inspectionRef).toBe('Konyhabútor végső ellenőrzés')
    expect(getQaDb().tickets.some((t) => t.id === created.id)).toBe(true)

    const shortTitle = await createTicket({
      ticketType: 'javitas', priority: 'magas', title: 'Rö', description: 'Elég hosszú leírás ide.',
    }).catch((e: unknown) => e)
    expect((shortTitle as ApiError).status).toBe(400)

    const shortDesc = await createTicket({
      ticketType: 'javitas', priority: 'magas', title: 'Megfelelő cím', description: 'rövid',
    }).catch((e: unknown) => e)
    expect((shortDesc as ApiError).status).toBe(400)

    const badInspection = await createTicket({
      ticketType: 'javitas', priority: 'magas', title: 'Megfelelő cím',
      description: 'Elég hosszú leírás ide.', inspectionId: 'INSP-000',
    }).catch((e: unknown) => e)
    expect((badInspection as ApiError).status).toBe(404)
  })
})

describe('hibajegy FSM-átmenetek + eszkaláció', () => {
  it('assign: bejelentve → kiosztva; felelős nélkül 400; folyamatban-ból 409', async () => {
    const bad = await transitionTicket(IDS.ticketReported, 'assign', { assigneeName: ' ' })
      .catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)

    const assigned = await transitionTicket(IDS.ticketReported, 'assign', {
      assigneeName: 'Varga László',
    })
    expect(assigned.status).toBe('kiosztva')
    expect(assigned.assigneeName).toBe('Varga László')
    expect(assigned.assignedAt).not.toBeNull()

    const conflict = await transitionTicket(IDS.ticketInProgress, 'assign', {
      assigneeName: 'X Y',
    }).catch((e: unknown) => e)
    expect((conflict as ApiError).status).toBe(409)
  })

  it('resolve INTÉZKEDÉS NÉLKÜL → 400 (Resolve-guard); intézkedéssel megoldva + resolvedAt', async () => {
    const bad = await transitionTicket(IDS.ticketInProgress, 'resolve', { resolutionActions: [] })
      .catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)
    expect((bad as ApiError).message).toContain('legalább egy intézkedés')

    const resolved = await transitionTicket(IDS.ticketInProgress, 'resolve', {
      resolutionActions: [{ actionType: 'javitas', description: 'Hézag-korrekció', costAmount: 8000 }],
      resolutionNotes: 'Beszállítóval egyeztetve.',
    })
    expect(resolved.status).toBe('megoldva')
    expect(resolved.resolutionActions).toHaveLength(1)
    expect(resolved.resolvedAt).not.toBeNull()
  })

  it('reject: indok nélkül 400; indokkal elutasitva és az indok a resolutionNotes-ba kerül (backend-tükör)', async () => {
    const bad = await transitionTicket(IDS.ticketInProgress, 'reject', { reason: ' ' })
      .catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)

    const rejected = await transitionTicket(IDS.ticketInProgress, 'reject', {
      reason: 'Nem minőségi hiba.',
    })
    expect(rejected.status).toBe('elutasitva')
    expect(rejected.resolutionNotes).toBe('Nem minőségi hiba.')
  })

  it('reopen: a hozzárendelés, kezdés és megjegyzés törlődik (Reopen() tükör); megoldva terminális', async () => {
    const reopened = await transitionTicket(IDS.ticketRejected, 'reopen', {})
    expect(reopened.status).toBe('bejelentve')
    expect(reopened.assigneeName).toBeNull()
    expect(reopened.assignedAt).toBeNull()
    expect(reopened.startedAt).toBeNull()
    expect(reopened.resolutionNotes).toBeNull()

    const done = await transitionTicket(IDS.ticketResolved, 'reopen', {}).catch((e: unknown) => e)
    expect((done as ApiError).status).toBe(409)
  })

  it('eszkaláció: csak felfelé (409 azonos/alacsonyabb rangra), megoldotton 409, ismeretlen prioritásra 400', async () => {
    const up = await escalateTicket(IDS.ticketReported, 'magas')
    expect(up.priority).toBe('magas')

    const same = await escalateTicket(IDS.ticketReported, 'magas').catch((e: unknown) => e)
    expect((same as ApiError).status).toBe(409)
    expect((same as ApiError).message).toContain('magasabbnak')

    const resolved = await escalateTicket(IDS.ticketResolved, 'kritikus').catch((e: unknown) => e)
    expect((resolved as ApiError).status).toBe(409)

    const bad = await escalateTicket(IDS.ticketReported, '' as never).catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)
  })

  it('teljes lánc: assign → start → resolve', async () => {
    await transitionTicket(IDS.ticketReported, 'assign', { assigneeName: 'Varga László' })
    await transitionTicket(IDS.ticketReported, 'start', {})
    const done = await transitionTicket(IDS.ticketReported, 'resolve', {
      resolutionActions: [{ actionType: 'csere', description: 'Kötőelem-csomag pótlása', costAmount: 4500 }],
    })
    expect(done.status).toBe('megoldva')
  })

  it('ismeretlen hibajegy → 404', async () => {
    const error = await transitionTicket('QAT-000', 'reopen', {}).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

describe('RULE-6 keresztkötés a kontraktusban: hibajegy-mutáció → átvizsgálás openTickets', () => {
  it('kapcsolt hibajegy létrehozása növeli, megoldása csökkenti az openTickets-t', async () => {
    expect((await fetchInspection(IDS.inspFailedMinor)).openTickets).toBe(1)

    await createTicket({
      ticketType: 'javitas', priority: 'kozepes',
      title: 'Második hézag-hibajegy',
      description: 'A beérkező ellenőrzés második hibájának javítása.',
      inspectionId: IDS.inspFailedMinor,
    })
    expect((await fetchInspection(IDS.inspFailedMinor)).openTickets).toBe(2)

    // a seed-beli QAT-303 (folyamatban) megoldása után már csak az új marad nyitva
    await transitionTicket(IDS.ticketInProgress, 'resolve', {
      resolutionActions: [{ actionType: 'javitas', description: 'Hézag-korrekció', costAmount: 0 }],
    })
    expect((await fetchInspection(IDS.inspFailedMinor)).openTickets).toBe(1)
  })
})

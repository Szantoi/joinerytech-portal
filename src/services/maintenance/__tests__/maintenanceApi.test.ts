import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import {
  maintenanceApiHandlers, resetMaintenanceDb, getMaintenanceDb, MNT_SEED_IDS, seedDay,
} from '../../../mocks/maintenanceApi'
import { fetchAsset, fetchAssets } from '../assets'
import {
  assignWorkOrder, createWorkOrder, fetchWorkOrder, fetchWorkOrders, transitionWorkOrder,
} from '../workOrders'
import { ApiError } from '../../apiClient'

/**
 * Maintenance MSW kontraktus-tükör tesztek — állapottartó store + FSM guardok
 * (409), a start felelős-guardja (409), kötelező payload (400), SZÁMÍTOTT
 * eszköz-státusz (calc.ts a mock alatt is) + rule-6 keresztkötés a
 * kontraktusban (munkalap-átmenet → eszköz-státusz változik).
 */

const server = setupServer(...maintenanceApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetMaintenanceDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const IDS = MNT_SEED_IDS

describe('eszközök (számított státusz)', () => {
  it('lista: 6 eszköz kód-sorrendben, a státusz mind a 4 ága előáll', async () => {
    const all = await fetchAssets()
    expect(all).toHaveLength(6)
    expect(all.map((a) => a.code)).toEqual([...all.map((a) => a.code)].sort())

    const byId = new Map(all.map((a) => [a.id, a]))
    expect(byId.get(IDS.assetOperational)?.status).toBe('uzemel')
    expect(byId.get(IDS.assetBreakdown)?.status).toBe('geptores')     // folyamatban lévő leállásos javítás
    expect(byId.get(IDS.assetMaintenance)?.status).toBe('karbantartas') // leállásos megelőző
    expect(byId.get(IDS.assetRetired)?.status).toBe('selejtezve')
  })

  it('kind/q szűrők szerver-oldaliak', async () => {
    const vehicles = await fetchAssets({ kind: 'jarmu' })
    expect(vehicles).toHaveLength(1)
    expect(vehicles[0].id).toBe(IDS.assetVehicle)

    const holzma = await fetchAssets({ q: 'holzma' })
    expect(holzma).toHaveLength(1)
    expect(holzma[0].id).toBe(IDS.assetOperational)
  })

  it('részlet: esedékes tervek száma számított (due + dueSoon) + 404 ismeretlen id-ra', async () => {
    // uzemora-terv MOST esedékes (8320 >= 7800 + 500)
    const rover = await fetchAsset(IDS.assetHoursDue)
    expect(rover.duePlans).toBe(1)
    // idokoz-terv 5 nap múlva esedékes → dueSoon (küszöb: 7 nap)
    const holzma = await fetchAsset(IDS.assetOperational)
    expect(holzma.duePlans).toBe(1)
    // nem esedékes terv nem számít bele
    const vw = await fetchAsset(IDS.assetVehicle)
    expect(vw.duePlans).toBe(0)

    const error = await fetchAsset('ast-nincs').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('openWorkOrders a nevesített nyitott-guard szerint számolt', async () => {
    const rover = await fetchAsset(IDS.assetHoursDue)
    // MWO-101 (bejelentve) + MWO-108 (utemezve) nyitott; MWO-107 (elutasitva) nem
    expect(rover.openWorkOrders).toBe(2)
  })
})

describe('munkalapok — lista, szűrők, létrehozás', () => {
  it('lista: 8 seed-munkalap; status/type/assetId/open szűrők szerver-oldaliak', async () => {
    expect(await fetchWorkOrders()).toHaveLength(8)
    const scheduled = await fetchWorkOrders({ status: 'utemezve' })
    expect(scheduled.map((wo) => wo.id).sort()).toEqual([IDS.woScheduled, IDS.woScheduledNoAssignee])

    const cleaning = await fetchWorkOrders({ type: 'takaritas' })
    expect(cleaning.every((wo) => wo.type === 'takaritas')).toBe(true)

    const forAsset = await fetchWorkOrders({ assetId: IDS.assetHoursDue })
    expect(forAsset).toHaveLength(3)

    const open = await fetchWorkOrders({ open: true })
    expect(open.map((wo) => wo.id).sort()).toEqual(
      [IDS.woReported, IDS.woScheduled, IDS.woBreakdown, IDS.woMaintenance, IDS.woScheduledNoAssignee].sort(),
    )
  })

  it('létrehozás: bejelentve státusszal indul (ReportWorkOrderCommand tükör); üres cím → 400', async () => {
    const created = await createWorkOrder({
      assetId: IDS.assetOperational, type: 'javitas', priority: 'magas',
      title: 'Vákuum-szivárgás', description: 'Szivárgás a 3-as körben.', requiresDowntime: false,
    })
    expect(created.status).toBe('bejelentve')
    expect(created.assetCode).toBe('MA-001')
    expect(getMaintenanceDb().workOrders.some((wo) => wo.id === created.id)).toBe(true)

    const bad = await createWorkOrder({
      assetId: IDS.assetOperational, type: 'javitas', priority: 'magas',
      title: '  ', description: 'x', requiresDowntime: false,
    }).catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)
  })
})

describe('munkalap FSM-átmenetek', () => {
  it('schedule: bejelentve → utemezve; dátum/óra nélkül 400', async () => {
    const bad = await transitionWorkOrder(IDS.woReported, 'schedule', {
      scheduledAt: '', estimatedHours: 0,
    }).catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)

    const updated = await transitionWorkOrder(IDS.woReported, 'schedule', {
      scheduledAt: seedDay(3), estimatedHours: 2,
    })
    expect(updated.status).toBe('utemezve')
    expect(updated.scheduledAt).toBe(seedDay(3))
    // a store tényleg átállt (nem csak a válasz)
    expect((await fetchWorkOrder(IDS.woReported)).status).toBe('utemezve')
  })

  it('assign: bejelentve/utemezve-ben megy, folyamatban 409; hiányos payload 400', async () => {
    const assigned = await assignWorkOrder(IDS.woScheduledNoAssignee, {
      assignmentType: 'belso', assigneeName: 'Varga László',
    })
    expect(assigned.assigneeName).toBe('Varga László')

    const conflict = await assignWorkOrder(IDS.woBreakdown, {
      assignmentType: 'belso', assigneeName: 'X',
    }).catch((e: unknown) => e)
    expect((conflict as ApiError).status).toBe(409)

    const bad = await assignWorkOrder(IDS.woReported, {
      assignmentType: 'belso', assigneeName: '  ',
    }).catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)
  })

  it('start FELELŐS NÉLKÜL → 409 (StartWork aggregátum-guard); felelőssel megy', async () => {
    const blocked = await transitionWorkOrder(IDS.woScheduledNoAssignee, 'start', {})
      .catch((e: unknown) => e)
    expect((blocked as ApiError).status).toBe(409)
    expect((blocked as ApiError).message).toContain('felelőst')

    await assignWorkOrder(IDS.woScheduledNoAssignee, {
      assignmentType: 'belso', assigneeName: 'Varga László',
    })
    const started = await transitionWorkOrder(IDS.woScheduledNoAssignee, 'start', {})
    expect(started.status).toBe('folyamatban')
  })

  it('tiltott átmenet → 409 a guard-üzenettel; a kesz terminális', async () => {
    // bejelentve nem indítható (aggregátum-tükör: előbb ütemezni kell)
    const error = await transitionWorkOrder(IDS.woReported, 'start', {}).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('Érvénytelen FSM-átmenet')

    // terminális kesz-ből semmi nem hívható
    const done = await transitionWorkOrder(IDS.woCompleted, 'reopen', {}).catch((e: unknown) => e)
    expect((done as ApiError).status).toBe(409)
  })

  it('complete: óraszám nélkül 400, óraszámmal kesz + completedAt', async () => {
    const bad = await transitionWorkOrder(IDS.woBreakdown, 'complete', { actualHours: 0 })
      .catch((e: unknown) => e)
    expect((bad as ApiError).status).toBe(400)

    const completed = await transitionWorkOrder(IDS.woBreakdown, 'complete', { actualHours: 2.5 })
    expect(completed.status).toBe('kesz')
    expect(completed.actualHours).toBe(2.5)
    expect(completed.completedAt).not.toBeNull()
  })

  it('postpone/reject: indok nélkül 400, indokkal átáll', async () => {
    const badPostpone = await transitionWorkOrder(IDS.woScheduled, 'postpone', { reason: ' ' })
      .catch((e: unknown) => e)
    expect((badPostpone as ApiError).status).toBe(400)

    const postponed = await transitionWorkOrder(IDS.woScheduled, 'postpone', {
      reason: 'Alkatrészre várunk.',
    })
    expect(postponed.status).toBe('halasztva')
    expect(postponed.postponementReason).toBe('Alkatrészre várunk.')

    const rejected = await transitionWorkOrder(IDS.woReported, 'reject', {
      reason: 'Duplikált bejelentés.',
    })
    expect(rejected.status).toBe('elutasitva')
    expect(rejected.rejectionReason).toBe('Duplikált bejelentés.')
  })

  it('reopen: a hozzárendelés, ütemezés és indokok törlődnek (Reopen() tükör)', async () => {
    const reopened = await transitionWorkOrder(IDS.woPostponed, 'reopen', {})
    expect(reopened.status).toBe('bejelentve')
    expect(reopened.assigneeName).toBeNull()
    expect(reopened.assignmentType).toBeNull()
    expect(reopened.scheduledAt).toBeNull()
    expect(reopened.postponementReason).toBeUndefined()
  })

  it('teljes lánc: schedule → assign → start → complete', async () => {
    await transitionWorkOrder(IDS.woReported, 'schedule', { scheduledAt: seedDay(1), estimatedHours: 3 })
    await assignWorkOrder(IDS.woReported, { assignmentType: 'kulso', assigneeName: 'Biesse Service' })
    await transitionWorkOrder(IDS.woReported, 'start', {})
    const done = await transitionWorkOrder(IDS.woReported, 'complete', { actualHours: 4 })
    expect(done.status).toBe('kesz')
  })

  it('ismeretlen munkalap → 404', async () => {
    const error = await transitionWorkOrder('MWO-000', 'reopen', {}).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

describe('RULE-6 keresztkötés a kontraktusban: munkalap-átmenet → SZÁMÍTOTT eszköz-státusz', () => {
  it('a leállásos javítás lezárása után az eszköz visszaáll uzemel-re', async () => {
    expect((await fetchAsset(IDS.assetBreakdown)).status).toBe('geptores')

    await transitionWorkOrder(IDS.woBreakdown, 'complete', { actualHours: 3 })

    const after = await fetchAsset(IDS.assetBreakdown)
    expect(after.status).toBe('uzemel')
    expect(after.openWorkOrders).toBe(0)
  })

  it('leállásos ütemezett munka indítása átbillenti az eszközt karbantartas-ra', async () => {
    // MWO-102: megelőző + requiresDowntime a Holzma-n, felelőssel — indítható
    expect((await fetchAsset(IDS.assetOperational)).status).toBe('uzemel')

    await transitionWorkOrder(IDS.woScheduled, 'start', {})

    expect((await fetchAsset(IDS.assetOperational)).status).toBe('karbantartas')
  })
})

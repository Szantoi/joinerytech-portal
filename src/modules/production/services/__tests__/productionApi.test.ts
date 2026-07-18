import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { productionApiHandlers, resetProductionDb, PRODUCTION_SEED_IDS } from '../../mocks'
import { ApiError } from '../../../../services/apiClient'
import {
  fetchPlans, fetchPlan, createPlan, transitionPlan, reservePanels, fetchPriorityProfiles,
  assignBatch, cuttingPlanSchema, cuttingPlanSummarySchema,
} from '../plans'
import {
  fetchExecutions, fetchExecution, fetchExecutionProgress, fetchExecutionMilestones,
  startExecution, recordProgress, completeExecution, cancelExecution,
  executionSchema, executionSummarySchema,
} from '../executions'
import {
  fetchOrders, fetchOrder, fetchOrderCuttingList, submitOrder, revertOrder, calculateOrder,
  doorOrderSchema, pagedOrdersSchema,
} from '../orders'
import { fetchQuotes, approveQuote, rejectQuote, fetchWasteReport, quoteListItemSchema } from '../quotes'

/**
 * Production MSW kontraktus-tükör tesztek — állapottartó store + FSM guardok
 * a VÉGPONTONKÉNT dokumentált hibakóddal (400 planning/quotes/joinery,
 * 409/422 executions), zod-séma konformitás (a mock a doksi alakját adja),
 * és rule-6 kereszt-entitás (freeze → assign-batch-forrás; calculate →
 * cutting-list cache).
 */

const server = setupServer(...productionApiHandlers)
const IDS = PRODUCTION_SEED_IDS

beforeAll(() => server.listen())
beforeEach(() => resetProductionDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('vágótervek — lista, séma, FSM', () => {
  it('lista: 4 seed-terv, séma megfelel (summary — dailyPlans NÉLKÜL)', async () => {
    const rows = await fetchPlans()
    expect(rows).toHaveLength(4)
    for (const row of rows) {
      expect(() => cuttingPlanSummarySchema.parse(row)).not.toThrow()
      expect((row as { dailyPlans?: unknown }).dailyPlans).toBeUndefined()
    }
  })

  it('részlet: a séma szerint, dailyPlans-szal', async () => {
    const plan = await fetchPlan(IDS.planDraft)
    expect(() => cuttingPlanSchema.parse(plan)).not.toThrow()
    expect(plan.dailyPlans.length).toBeGreaterThan(0)
  })

  it('404 ismeretlen tervre', async () => {
    const error = await fetchPlan('CPL-999').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('create: planDays tartományon kívül → 400', async () => {
    const error = await createPlan({ planDate: '2099-01-01', planDays: 200, strategyId: 'maxcut-v1' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('create: múltbeli planDate → 400', async () => {
    const error = await createPlan({ planDate: '2020-01-01', planDays: 14, strategyId: 'maxcut-v1' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('create: érvényes payload → 201-alakú válasz, a lista bővül', async () => {
    const before = await fetchPlans()
    const res = await createPlan({ planDate: '2099-06-01', planDays: 14, strategyId: 'maxcut-v1' })
    expect(res.planId).toBeTruthy()
    const after = await fetchPlans()
    expect(after.length).toBe(before.length + 1)
  })

  it('publish: Draft→Published sikeres snapshotId-vel; snapshot nélkül 400', async () => {
    const noSnapshot = await transitionPlan(IDS.planDraft, 'publish', { profileSnapshotId: '' })
      .catch((e: unknown) => e)
    expect((noSnapshot as ApiError).status).toBe(400)

    const res = await transitionPlan(IDS.planDraft, 'publish', { profileSnapshotId: IDS.profileDefault })
    expect(res.status).toBe('Published')
    expect((await fetchPlan(IDS.planDraft)).status).toBe('Published')
  })

  it('publish rossz forrásállapotból → 400 (FSM-sértés, NEM 409)', async () => {
    const error = await transitionPlan(IDS.planFrozen, 'publish', { profileSnapshotId: IDS.profileDefault })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).message).toContain('publish')
  })

  it('freeze: Published→Frozen; close: Frozen→Closed', async () => {
    const frozen = await transitionPlan(IDS.planPublished, 'freeze')
    expect(frozen.status).toBe('Frozen')
    const closed = await transitionPlan(IDS.planFrozen, 'close')
    expect(closed.status).toBe('Closed')
  })

  it('reserve-panels: {planId, reservedCount}', async () => {
    const res = await reservePanels(IDS.planPublished)
    expect(res.planId).toBe(IDS.planPublished)
    expect(res.reservedCount).toBeGreaterThan(0)
  })

  it('priority-profiles: legalább az alapértelmezett profil', async () => {
    const profiles = await fetchPriorityProfiles()
    expect(profiles.some((p) => p.isDefault)).toBe(true)
  })

  it('assign-batch (kevert prefix /cutting/api/plans/{date}/assign-batch): siker → executionId+status, ismeretlen nap → 404, duplikált batch → 409', async () => {
    const plan = await fetchPlan(IDS.planDraft)
    const date = plan.dailyPlans[0].date

    const res = await assignBatch(date, {
      batchId: 'BATCH-T1', machineId: 'm1', operatorId: 'op1', priority: 5,
      startTime: `${date}T08:00`,
    })
    expect(res.executionId).toBeTruthy()
    expect(res.status).toBe('Scheduled')

    const dup = await assignBatch(date, {
      batchId: 'BATCH-T1', machineId: 'm1', operatorId: 'op1', priority: 5,
      startTime: `${date}T08:00`,
    }).catch((e: unknown) => e)
    expect((dup as ApiError).status).toBe(409)

    const unknownDay = await assignBatch('2099-12-31', {
      batchId: 'BATCH-T2', machineId: 'm1', operatorId: 'op1', priority: 5,
      startTime: '2099-12-31T08:00',
    }).catch((e: unknown) => e)
    expect((unknownDay as ApiError).status).toBe(404)
  })
})

describe('végrehajtás — lista, séma, FSM (409 állapot / 422 payload)', () => {
  it('lista: 6 seed-végrehajtás, summary-séma', async () => {
    const rows = await fetchExecutions()
    expect(rows).toHaveLength(6)
    for (const row of rows) expect(() => executionSummarySchema.parse(row)).not.toThrow()
  })

  it('részlet + idővonal + mérföldkövek a séma szerint', async () => {
    const execution = await fetchExecution(IDS.execInProgress)
    expect(() => executionSchema.parse(execution)).not.toThrow()
    expect((await fetchExecutionProgress(IDS.execInProgress)).length).toBeGreaterThan(0)
    expect((await fetchExecutionMilestones(IDS.execInProgress)).length).toBeGreaterThan(0)
  })

  it('start: hiányzó HMAC-mező → 422; érvényes payload → állapotváltás', async () => {
    const invalid = await startExecution(IDS.execScheduled, { workerId: '', badgeHmacBase64: '', hmacKeyVersion: '' })
      .catch((e: unknown) => e)
    expect((invalid as ApiError).status).toBe(422)

    await startExecution(IDS.execScheduled, { workerId: 'W1', badgeHmacBase64: 'hmac', hmacKeyVersion: 'v1' })
    expect((await fetchExecution(IDS.execScheduled)).status).toBe('Started')
  })

  it('start rossz állapotból → 409 (állapot-sértés)', async () => {
    const error = await startExecution(IDS.execInProgress, { workerId: 'W1', badgeHmacBase64: 'h', hmacKeyVersion: 'v1' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('progress: PanelCompleted növeli a számlálót, eventId-idempotens', async () => {
    const before = await fetchExecution(IDS.execInProgress)
    await recordProgress(IDS.execInProgress, {
      eventId: 'EV-NEW-1', kind: 'PanelCompleted', occurredAt: new Date().toISOString(),
      eventHmacBase64: 'h', hmacKeyVersion: 'v1',
    })
    const after = await fetchExecution(IDS.execInProgress)
    expect(after.panelsCompleted).toBe(before.panelsCompleted + 1)

    // idempotens: ugyanazzal az eventId-vel újra — nem nő tovább
    await recordProgress(IDS.execInProgress, {
      eventId: 'EV-NEW-1', kind: 'PanelCompleted', occurredAt: new Date().toISOString(),
      eventHmacBase64: 'h', hmacKeyVersion: 'v1',
    })
    expect((await fetchExecution(IDS.execInProgress)).panelsCompleted).toBe(after.panelsCompleted)
  })

  it('complete: panel-guard 422, majd teljes panel-számmal siker', async () => {
    const blocked = await completeExecution(IDS.execInProgress, { proofLevel: 'HashOnly', proofHash: 'h' })
      .catch((e: unknown) => e)
    expect((blocked as ApiError).status).toBe(422)

    // az InProgress seed 11/32 — hajtsunk végig elég progress-eseményt
    for (let i = 0; i < 21; i += 1) {
      await recordProgress(IDS.execInProgress, {
        eventId: `EV-BULK-${i}`, kind: 'PanelCompleted', occurredAt: new Date().toISOString(),
        eventHmacBase64: 'h', hmacKeyVersion: 'v1',
      })
    }
    await completeExecution(IDS.execInProgress, { proofLevel: 'SignedEvidence', proofHash: 'h' })
    expect((await fetchExecution(IDS.execInProgress)).status).toBe('Completed')
  })

  it('cancel: érvényes reason (SZÁMKÉNT a dróton) → Cancelled', async () => {
    await cancelExecution(IDS.execScheduled, 'MaterialShortage')
    expect((await fetchExecution(IDS.execScheduled)).status).toBe('Cancelled')
  })

  it('cancel terminális állapotból → 409', async () => {
    const error = await cancelExecution(IDS.execCompleted, 'OperatorCancelled').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })
})

describe('ajtórendelések (joinery) — lapozott lista, FSM, kalkuláció', () => {
  it('lapozott lista a séma szerint', async () => {
    const page = await fetchOrders({ page: 1, pageSize: 20 })
    expect(() => pagedOrdersSchema.parse(page)).not.toThrow()
    expect(page.totalCount).toBe(7)
  })

  it('érvénytelen lapozás → 400 validációs tömb', async () => {
    const error = await fetchOrders({ page: 0, pageSize: 20 }).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('részlet a séma szerint; 404 ismeretlenre', async () => {
    const order = await fetchOrder(IDS.ordDraft)
    expect(() => doorOrderSchema.parse(order)).not.toThrow()
    const error = await fetchOrder('ORD-999').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('submit: üres tétellistával 400; tételekkel Submitted', async () => {
    const empty = await submitOrder(IDS.ordDraftEmpty).catch((e: unknown) => e)
    expect((empty as ApiError).status).toBe(400)

    await submitOrder(IDS.ordDraft)
    expect((await fetchOrder(IDS.ordDraft)).status).toBe('Submitted')
  })

  it('submit rossz forrásállapotból → 400', async () => {
    const error = await submitOrder(IDS.ordCalculated).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('revert: Calculated→Draft; rossz forrásállapotból 400', async () => {
    await revertOrder(IDS.ordCalculated)
    expect((await fetchOrder(IDS.ordCalculated)).status).toBe('Draft')

    const error = await revertOrder(IDS.ordSubmitted).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('calculate: szabásjegyzék a séma szerint; üres rendelésre 400', async () => {
    const list = await calculateOrder(IDS.ordCalculated)
    expect(list.items.length).toBeGreaterThan(0)

    const error = await calculateOrder(IDS.ordDraftEmpty).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('cutting-list lekérdezés a Calculated rendelésre elérhető', async () => {
    const list = await fetchOrderCuttingList(IDS.ordCalculated)
    expect(list.orderId).toBe(IDS.ordCalculated)
  })
})

describe('árajánlatok + waste-riport', () => {
  it('lista + status-szűrő a séma szerint', async () => {
    const all = await fetchQuotes()
    expect(all.length).toBeGreaterThan(0)
    for (const q of all) expect(() => quoteListItemSchema.parse(q)).not.toThrow()

    const pending = await fetchQuotes('PendingReview')
    expect(pending.every((q) => q.status === 'PendingReview')).toBe(true)
  })

  it('approve: hiányos payload 400; érvényes → Quoted + ár rögzítve', async () => {
    const invalid = await approveQuote(IDS.quotePending, { quotedPriceAmount: 0, quotedPriceCurrency: '', customerEmail: '' })
      .catch((e: unknown) => e)
    expect((invalid as ApiError).status).toBe(400)

    await approveQuote(IDS.quotePending, { quotedPriceAmount: 50000, quotedPriceCurrency: 'HUF', customerEmail: 'x@example.hu' })
    const [quote] = await fetchQuotes('Quoted')
    expect(quote).toBeDefined()
  })

  it('approve rossz forrásállapotból → 400', async () => {
    const error = await approveQuote(IDS.quoteRejected, { quotedPriceAmount: 1, quotedPriceCurrency: 'HUF', customerEmail: 'x@example.hu' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('reject: indok nélkül 400; indokkal Rejected', async () => {
    const invalid = await rejectQuote(IDS.quotePending2, { reason: '', customerEmail: 'x@example.hu' })
      .catch((e: unknown) => e)
    expect((invalid as ApiError).status).toBe(400)

    await rejectQuote(IDS.quotePending2, { reason: 'Nem gazdaságos', customerEmail: 'x@example.hu' })
    expect((await fetchQuotes('Rejected')).some((q) => q.id === IDS.quotePending2)).toBe(true)
  })

  it('waste-riport: 3 mezős összesítő, érvénytelen időszakra 400', async () => {
    const report = await fetchWasteReport()
    expect(report.executionCount).toBeGreaterThanOrEqual(0)

    const error = await fetchWasteReport('2099-01-01', '2000-01-01').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })
})

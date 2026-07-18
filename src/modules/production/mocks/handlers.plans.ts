import { http, HttpResponse } from 'msw'
import { CUTTING_API, CUTTING_ASSIGN_BATCH_API, PLAN_DAYS_MAX, PLAN_DAYS_MIN } from '../services/config'
import { CUTTING_PLAN_FSM, publishSnapshotBlockReason } from '../services/fsm'
import type { CuttingPlan, CreatePlanInput, AssignBatchInput } from '../services/plans'
import { todayIso } from '../../../services/dateUtils'
import { cuttingError, getProductionDb, guardFsm, notFound } from './db'
import type { ExecutionSeed } from './db'

/**
 * Vágóterv (planning) handlerek — a doksi 1.1 planning-csoport tükre.
 * Hiba-szemantika: Result.Invalid → **400** (a planning végpontok listája
 * 400/404 — a 409 itt NEM szerepel). A publish/freeze/close guardok a
 * services/production/fsm.ts KÖZÖS tábláit futtatják.
 *
 * ⚠ A PUT /{planId} (Obsolete UpdateStatus FSM-bypass) SZÁNDÉKOSAN nincs
 * mockolva — a portál nem használhatja (doksi 1.5).
 */

const BASE = `${CUTTING_API}/planning`
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function findPlan(id: string | readonly string[]): CuttingPlan | undefined {
  return getProductionDb().plans.find((p) => p.id === id)
}

/** Lista-alak: CuttingPlanSummaryResponse (dailyPlans nélkül). */
function toSummary(plan: CuttingPlan) {
  return {
    id: plan.id, planDate: plan.planDate, planDays: plan.planDays,
    status: plan.status, strategyId: plan.strategyId,
  }
}

export const planHandlers = [
  http.get(`${BASE}/`, () => {
    // legfrissebb terv-dátum elöl
    const sorted = [...getProductionDb().plans].sort((a, b) => b.planDate.localeCompare(a.planDate))
    return HttpResponse.json(sorted.map(toSummary))
  }),

  // POST /planning/ — CreateCuttingPlanRequest (planDays 7..90, planDate ≥ ma)
  http.post(`${BASE}/`, async ({ request }) => {
    const body = (await request.json()) as Partial<CreatePlanInput> | null
    const planDate = body?.planDate ?? ''
    const planDays = body?.planDays ?? 14
    if (!DATE_RE.test(planDate)) {
      return cuttingError(400, 'Invalid', 'Érvénytelen tervkezdő dátum (yyyy-MM-dd).')
    }
    if (planDate < todayIso()) {
      return cuttingError(400, 'Invalid', 'A terv kezdődátuma nem lehet a múltban.')
    }
    if (planDays < PLAN_DAYS_MIN || planDays > PLAN_DAYS_MAX) {
      return cuttingError(400, 'Invalid', `A tervablak ${PLAN_DAYS_MIN}..${PLAN_DAYS_MAX} nap lehet.`)
    }

    const db = getProductionDb()
    const id = `CPL-4${String(db.plans.length + 10).padStart(2, '0')}`
    const plan: CuttingPlan = {
      id, planDate, planDays,
      status: 'Draft',
      strategyId: body?.strategyId ?? 'maxcut-v1',
      // a valós backend a nyitott rendelésekből ütemez; a mock egy üres
      // nap-szelettel indít, hogy a publish DaySlot-guardja teljesüljön
      dailyPlans: [{
        id: `${id}-D1`, date: planDate,
        availableCapacity: 480, allocatedCapacity: 0, utilizationPercent: 0,
        jobs: [],
      }],
    }
    db.plans.unshift(plan)
    return HttpResponse.json(
      { planId: id, dailyPlans: plan.dailyPlans, scheduledJobs: [], totalYieldPercent: 0 },
      { status: 201 },
    )
  }),

  http.get(`${BASE}/:planId`, ({ params }) => {
    const plan = findPlan(params.planId as string)
    return plan ? HttpResponse.json(plan) : notFound('Vágóterv')
  }),

  // Publish: Draft→Published — snapshotId + ≥1 DaySlot guard (backend-tükör)
  http.post(`${BASE}/:planId/publish`, async ({ params, request }) => {
    const plan = findPlan(params.planId as string)
    if (!plan) return notFound('Vágóterv')
    const guard = guardFsm(CUTTING_PLAN_FSM, 'publish', plan.status, 400)
    if (guard) return guard

    const body = (await request.json()) as { profileSnapshotId?: string } | null
    const snapshotBlock = publishSnapshotBlockReason(body?.profileSnapshotId ?? '')
    if (snapshotBlock) return cuttingError(400, 'Invalid', snapshotBlock)
    if (plan.dailyPlans.length === 0) {
      return cuttingError(400, 'Invalid', 'A publikáláshoz legalább egy nap-szelet szükséges.')
    }

    plan.status = CUTTING_PLAN_FSM.publish.to
    return HttpResponse.json({ planId: plan.id, status: plan.status })
  }),

  // Freeze: Published→Frozen — ez triggereli a backendben az inventory
  // offcut-batch regisztrációt (kereszt-entitás; a kliens-oldali párja a
  // usePlanTransition crossEntity-invalidálása).
  http.post(`${BASE}/:planId/freeze`, ({ params }) => {
    const plan = findPlan(params.planId as string)
    if (!plan) return notFound('Vágóterv')
    const guard = guardFsm(CUTTING_PLAN_FSM, 'freeze', plan.status, 400)
    if (guard) return guard
    if (plan.dailyPlans.length === 0) {
      return cuttingError(400, 'Invalid', 'A fagyasztáshoz legalább egy nyitott nap-szelet szükséges.')
    }
    plan.status = CUTTING_PLAN_FSM.freeze.to
    return HttpResponse.json({ planId: plan.id, status: plan.status })
  }),

  http.post(`${BASE}/:planId/close`, ({ params }) => {
    const plan = findPlan(params.planId as string)
    if (!plan) return notFound('Vágóterv')
    const guard = guardFsm(CUTTING_PLAN_FSM, 'close', plan.status, 400)
    if (guard) return guard
    plan.status = CUTTING_PLAN_FSM.close.to
    return HttpResponse.json({ planId: plan.id, status: plan.status })
  }),

  // Panel-foglalás (Inventory az SSoT — a mock a job-számot foglalja le)
  http.post(`${BASE}/:planId/reserve-panels`, ({ params }) => {
    const plan = findPlan(params.planId as string)
    if (!plan) return notFound('Vágóterv')
    const reservedCount = plan.dailyPlans.reduce((sum, d) => sum + d.jobs.length, 0)
    return HttpResponse.json({ planId: plan.id, reservedCount })
  }),

  http.get(`${CUTTING_API}/priority-profiles/`, () =>
    HttpResponse.json(getProductionDb().priorityProfiles)),

  /**
   * ⚠ KEVERT prefixű route (P7): POST /cutting/api/plans/{date}/assign-batch —
   * szó szerint a doksi 1.1 útvonala, NEM a /api/cutting prefix alatt.
   * Válasz: 200 {executionId, status}; 400 payload-sértés, 404 ismeretlen
   * nap, 409 már hozzárendelt batch.
   */
  http.post(`${CUTTING_ASSIGN_BATCH_API}/:date/assign-batch`, async ({ params, request }) => {
    const date = params.date as string
    if (!DATE_RE.test(date)) return cuttingError(400, 'Invalid', 'Érvénytelen dátum (yyyy-MM-dd).')

    const db = getProductionDb()
    const hasDay = db.plans.some((p) => p.dailyPlans.some((d) => d.date === date))
    if (!hasDay) return notFound('Napi vágóterv')

    const body = (await request.json()) as Partial<AssignBatchInput> | null
    if (!body?.batchId || !body.machineId || !body.operatorId || !body.startTime) {
      return cuttingError(400, 'Invalid', 'batchId, machineId, operatorId és startTime kötelező.')
    }
    const priority = body.priority ?? 0
    if (priority < 1 || priority > 10) {
      return cuttingError(400, 'Invalid', 'A prioritás 1..10 közötti egész szám.')
    }
    if (db.assignedBatchIds.has(body.batchId)) {
      return cuttingError(409, 'Conflict', 'A batch már hozzá van rendelve egy végrehajtáshoz.')
    }

    db.assignedBatchIds.add(body.batchId)
    const executionId = `EXE-A${db.assignedBatchIds.size}`
    const execution: ExecutionSeed = {
      id: executionId, tenantId: 'TEN-DEMO-01', sheetId: body.batchId,
      status: 'Scheduled', panelsCompleted: 0, totalPanels: 24,
      scheduledAt: body.startTime, startedAt: null, completedAt: null,
      progressEvents: [], milestones: [],
    }
    db.executions.unshift(execution)
    return HttpResponse.json({ executionId, status: execution.status })
  }),
]

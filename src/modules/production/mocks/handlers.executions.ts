import { http, HttpResponse } from 'msw'
import { CUTTING_API } from '../services/config'
import { EXECUTION_FSM, completePanelsBlockReason } from '../services/fsm'
import { PROGRESS_EVENT_KIND_WIRE, PROOF_LEVEL_WIRE, CANCEL_REASON_WIRE } from '../services/wire'
import type { ProgressEventKind } from '../services/wire'
import { cuttingError, getProductionDb, guardFsm, isoTimestamp, notFound } from './db'
import type { ExecutionSeed } from './db'

/**
 * Végrehajtás (executions) handlerek — a doksi 1.1 executions-csoport tükre.
 * Hiba-szemantika: állapot-sértés → **409** (Conflict), payload-sértés →
 * **422** (Invalid). A request-oldali enumok SZÁMKÉNT érkeznek (wire-szabály)
 * — a mock a wire.ts szótárral validál és fordít vissza tagnévre.
 * A progress `eventId`-ra idempotens (backend-tükör).
 */

const BASE = `${CUTTING_API}/executions`

function findExecution(id: string | readonly string[]): ExecutionSeed | undefined {
  return getProductionDb().executions.find((e) => e.id === id)
}

/** Lista-alak: ExecutionDto Summary. */
function toSummary(e: ExecutionSeed) {
  return {
    id: e.id, status: e.status, scheduledAt: e.scheduledAt,
    panelsCompleted: e.panelsCompleted, totalPanels: e.totalPanels,
  }
}

/** Detail-alak: ExecutionDto (idővonal és scheduledAt nélkül). */
function toDto(e: ExecutionSeed) {
  return {
    id: e.id, tenantId: e.tenantId, sheetId: e.sheetId, status: e.status,
    panelsCompleted: e.panelsCompleted, totalPanels: e.totalPanels,
    startedAt: e.startedAt, completedAt: e.completedAt,
  }
}

/** SZÁM (wire) → enum-tagnév; ismeretlen érték → undefined (422-t vált ki). */
function kindFromWire(value: unknown): ProgressEventKind | undefined {
  const entry = Object.entries(PROGRESS_EVENT_KIND_WIRE).find(([, num]) => num === value)
  return entry?.[0] as ProgressEventKind | undefined
}

export const executionHandlers = [
  http.get(`${BASE}/`, () => {
    const sorted = [...getProductionDb().executions]
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    return HttpResponse.json(sorted.map(toSummary))
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const execution = findExecution(params.id as string)
    return execution ? HttpResponse.json(toDto(execution)) : notFound('Végrehajtás')
  }),

  http.get(`${BASE}/:id/progress`, ({ params }) => {
    const execution = findExecution(params.id as string)
    return execution ? HttpResponse.json(execution.progressEvents) : notFound('Végrehajtás')
  }),

  http.get(`${BASE}/:id/milestones`, ({ params }) => {
    const execution = findExecution(params.id as string)
    return execution ? HttpResponse.json(execution.milestones) : notFound('Végrehajtás')
  }),

  // Start: Scheduled→Started — badge-HMAC kötelező (422), állapot-sértés 409
  http.post(`${BASE}/:id/start`, async ({ params, request }) => {
    const execution = findExecution(params.id as string)
    if (!execution) return notFound('Végrehajtás')

    const body = (await request.json()) as
      | { workerId?: string; badgeHmacBase64?: string; hmacKeyVersion?: string }
      | null
    if (!body?.workerId || !body.badgeHmacBase64 || !body.hmacKeyVersion) {
      return cuttingError(422, 'Invalid', 'workerId, badgeHmacBase64 és hmacKeyVersion kötelező.')
    }
    const guard = guardFsm(EXECUTION_FSM, 'start', execution.status, 409)
    if (guard) return guard

    execution.status = EXECUTION_FSM.start.to
    execution.startedAt = isoTimestamp()
    return HttpResponse.json({})
  }),

  // RecordProgress: Started/InProgress→InProgress — kind SZÁM, eventId-idempotens
  http.post(`${BASE}/:id/progress`, async ({ params, request }) => {
    const execution = findExecution(params.id as string)
    if (!execution) return notFound('Végrehajtás')

    const body = (await request.json()) as
      | { eventId?: string; kind?: number; panel?: number; occurredAt?: string; eventHmacBase64?: string; hmacKeyVersion?: string }
      | null
    const kind = kindFromWire(body?.kind)
    if (!body?.eventId || kind === undefined || !body.occurredAt || !body.eventHmacBase64 || !body.hmacKeyVersion) {
      return cuttingError(422, 'Invalid', 'eventId, kind (szám), occurredAt és esemény-HMAC kötelező.')
    }
    const guard = guardFsm(EXECUTION_FSM, 'progress', execution.status, 409)
    if (guard) return guard

    // idempotencia: ismert eventId → no-op 200 (backend-tükör)
    if (execution.progressEvents.some((e) => e.eventId === body.eventId)) {
      return HttpResponse.json({})
    }

    execution.status = EXECUTION_FSM.progress.to
    if (kind === 'PanelCompleted' && execution.panelsCompleted < execution.totalPanels) {
      execution.panelsCompleted += 1
    }
    execution.progressEvents.push({
      eventId: body.eventId, kind,
      panelNumber: body.panel ?? null,
      occurredAt: body.occurredAt,
    })
    return HttpResponse.json({})
  }),

  // Complete: InProgress→Completed — proof-payload (422) + panel-guard (422)
  http.post(`${BASE}/:id/complete`, async ({ params, request }) => {
    const execution = findExecution(params.id as string)
    if (!execution) return notFound('Végrehajtás')

    const body = (await request.json()) as { proofLevel?: number; proofHash?: string } | null
    const validProof = Object.values(PROOF_LEVEL_WIRE).includes(body?.proofLevel as never)
    if (!validProof || !body?.proofHash) {
      return cuttingError(422, 'Invalid', 'proofLevel (szám) és proofHash kötelező.')
    }
    const guard = guardFsm(EXECUTION_FSM, 'complete', execution.status, 409)
    if (guard) return guard

    const panelsBlock = completePanelsBlockReason(execution.panelsCompleted, execution.totalPanels)
    if (panelsBlock) return cuttingError(422, 'Invalid', panelsBlock)

    execution.status = EXECUTION_FSM.complete.to
    execution.completedAt = isoTimestamp()
    return HttpResponse.json({})
  }),

  // Cancel: nem-terminál→Cancelled — reason SZÁM (CancelReason)
  http.post(`${BASE}/:id/cancel`, async ({ params, request }) => {
    const execution = findExecution(params.id as string)
    if (!execution) return notFound('Végrehajtás')

    const body = (await request.json()) as { reason?: number } | null
    if (!Object.values(CANCEL_REASON_WIRE).includes(body?.reason as never)) {
      return cuttingError(422, 'Invalid', 'reason (CancelReason szám) kötelező.')
    }
    const guard = guardFsm(EXECUTION_FSM, 'cancel', execution.status, 409)
    if (guard) return guard

    execution.status = EXECUTION_FSM.cancel.to
    return HttpResponse.json({})
  }),
]

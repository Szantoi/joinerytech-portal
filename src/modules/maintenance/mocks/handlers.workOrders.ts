import { http, HttpResponse } from 'msw'
import { MAINTENANCE_API_BASE } from '../services/config'
import {
  WORK_ORDER_FSM, canAssignWorkOrder, isWorkOrderOpen, startAssignmentBlockReason,
  type WorkOrderStatus,
} from '../services/fsm'
import type {
  WorkOrder, WorkOrderCreateInput, WorkOrderType,
} from '../services/workOrders'
import { getMaintenanceDb, guardTransition, jsonError, logTimestamp, notFound } from './db'

/**
 * Munkalap handlerek — lista, részlet, létrehozás (ReportWorkOrderCommand),
 * felelős-hozzárendelés (AssignWorkOrderCommand) és FSM-átmenetek
 * (Schedule/Start/Complete/Postpone/Reject/Reopen command-tükrök).
 * Tiltott átmenet → 409 (közös guard-tábla: services/maintenance/fsm.ts);
 * a start felelős nélkül → 409 (StartWork() aggregátum-guard tükre);
 * hiányzó kötelező payload → 400.
 */

const BASE = `${MAINTENANCE_API_BASE}/work-orders`

function findWorkOrder(id: string | readonly string[]): WorkOrder | undefined {
  return getMaintenanceDb().workOrders.find((wo) => wo.id === id)
}

/** Új munkalap-azonosító a seed-formátumban (MWO-1xx folytatólagos). */
function nextWorkOrderId(): string {
  const nums = getMaintenanceDb().workOrders
    .map((wo) => Number(wo.id.replace('MWO-', '')))
    .filter((n) => !Number.isNaN(n))
  return `MWO-${Math.max(0, ...nums) + 1}`
}

export const workOrderHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as WorkOrderStatus | null
    const type = url.searchParams.get('type') as WorkOrderType | null
    const assetId = url.searchParams.get('assetId')
    const open = url.searchParams.get('open')

    let rows = getMaintenanceDb().workOrders
    if (status) rows = rows.filter((wo) => wo.status === status)
    if (type) rows = rows.filter((wo) => wo.type === type)
    if (assetId) rows = rows.filter((wo) => wo.assetId === assetId)
    if (open === 'true') rows = rows.filter((wo) => isWorkOrderOpen(wo.status))
    // legfrissebb bejelentés elöl
    const sorted = [...rows].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const wo = findWorkOrder(params.id as string)
    return wo ? HttpResponse.json(wo) : notFound('Munkalap')
  }),

  // ReportWorkOrderCommand tükör — a munkalap mindig bejelentve-ként indul
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Partial<WorkOrderCreateInput> | null
    const asset = getMaintenanceDb().assets.find((a) => a.id === body?.assetId)
    if (!asset) return notFound('Eszköz')
    if (!body?.title?.trim()) return jsonError(400, 'BadRequest', 'A munkalap címe kötelező.')
    if (!body.description?.trim()) {
      return jsonError(400, 'BadRequest', 'A munkalap leírása kötelező.')
    }

    const wo: WorkOrder = {
      id: nextWorkOrderId(),
      assetId: asset.id, assetCode: asset.code, assetName: asset.name,
      type: body.type ?? 'javitas',
      priority: body.priority ?? 'kozepes',
      status: 'bejelentve',
      title: body.title.trim(),
      description: body.description.trim(),
      requiresDowntime: body.requiresDowntime ?? false,
      scheduledAt: null, estimatedHours: null, actualHours: null,
      assignmentType: null, assigneeName: null,
      reportedAt: logTimestamp().slice(0, 10), startedAt: null, completedAt: null,
      log: [{ at: logTimestamp(), text: 'Bejelentve' }],
    }
    getMaintenanceDb().workOrders.push(wo)
    return HttpResponse.json(wo, { status: 201 })
  }),

  // AssignWorkOrderCommand tükör — státusz-guardolt, de NEM FSM-átmenet
  http.put(`${BASE}/:id/assign`, async ({ params, request }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    if (!canAssignWorkOrder(wo.status)) {
      return jsonError(
        409, 'Conflict',
        `Felelős csak „bejelentve" vagy „utemezve" státuszban rendelhető hozzá — jelenlegi: „${wo.status}".`,
      )
    }
    const body = (await request.json()) as
      | { assignmentType?: 'belso' | 'kulso'; assigneeName?: string }
      | null
    const name = body?.assigneeName?.trim()
    if (!body?.assignmentType || !name) {
      return jsonError(400, 'BadRequest', 'A hozzárendelés típusa és a felelős neve kötelező.')
    }
    wo.assignmentType = body.assignmentType
    wo.assigneeName = name
    wo.log.push({
      at: logTimestamp(),
      text: `Felelős hozzárendelve: ${name} (${body.assignmentType === 'belso' ? 'belső' : 'külső'})`,
    })
    return HttpResponse.json(wo)
  }),

  // ScheduleWorkOrderCommand: bejelentve → utemezve, dátum + becsült óra kötelező
  http.put(`${BASE}/:id/schedule`, async ({ params, request }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'schedule', wo.status)
    if (guard) return guard

    const body = (await request.json()) as
      | { scheduledAt?: string; estimatedHours?: number }
      | null
    if (!body?.scheduledAt) {
      return jsonError(400, 'BadRequest', 'Az ütemezett dátum kötelező.')
    }
    if (!body.estimatedHours || body.estimatedHours <= 0) {
      return jsonError(400, 'BadRequest', 'A becsült óraszámnak pozitívnak kell lennie.')
    }

    wo.status = WORK_ORDER_FSM.schedule.to
    wo.scheduledAt = body.scheduledAt
    wo.estimatedHours = body.estimatedHours
    wo.log.push({ at: logTimestamp(), text: `Ütemezve ${body.scheduledAt}-ra (${body.estimatedHours} ó)` })
    return HttpResponse.json(wo)
  }),

  // StartWorkOrderCommand: utemezve → folyamatban — FELELŐS NÉLKÜL 409 (StartWork-guard)
  http.put(`${BASE}/:id/start`, ({ params }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'start', wo.status)
    if (guard) return guard
    const assignmentBlock = startAssignmentBlockReason(wo.assigneeName)
    if (assignmentBlock) return jsonError(409, 'Conflict', assignmentBlock)

    wo.status = WORK_ORDER_FSM.start.to
    wo.startedAt = logTimestamp().slice(0, 10)
    wo.log.push({
      at: logTimestamp(),
      text: `Munka megkezdve${wo.requiresDowntime ? ' — az eszköz leállítva' : ''}`,
    })
    return HttpResponse.json(wo)
  }),

  // CompleteWorkOrderCommand: folyamatban → kesz, tényleges óraszám kötelező (> 0)
  http.put(`${BASE}/:id/complete`, async ({ params, request }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'complete', wo.status)
    if (guard) return guard

    const body = (await request.json()) as { actualHours?: number } | null
    if (!body?.actualHours || body.actualHours <= 0) {
      return jsonError(400, 'BadRequest', 'A tényleges óraszámnak pozitívnak kell lennie.')
    }

    wo.status = WORK_ORDER_FSM.complete.to
    wo.actualHours = body.actualHours
    wo.completedAt = logTimestamp().slice(0, 10)
    wo.log.push({ at: logTimestamp(), text: `Lezárva — tényleges idő: ${body.actualHours} ó` })
    return HttpResponse.json(wo)
  }),

  // PostponeWorkOrderCommand: utemezve|folyamatban → halasztva, indok kötelező
  http.put(`${BASE}/:id/postpone`, async ({ params, request }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'postpone', wo.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    const reason = body?.reason?.trim()
    if (!reason) return jsonError(400, 'BadRequest', 'A halasztás indoka kötelező.')

    wo.status = WORK_ORDER_FSM.postpone.to
    wo.postponementReason = reason
    wo.log.push({ at: logTimestamp(), text: `Halasztva — ${reason}` })
    return HttpResponse.json(wo)
  }),

  // RejectWorkOrderCommand: bejelentve|utemezve → elutasitva, indok kötelező
  http.put(`${BASE}/:id/reject`, async ({ params, request }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'reject', wo.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    const reason = body?.reason?.trim()
    if (!reason) return jsonError(400, 'BadRequest', 'Az elutasítás indoka kötelező.')

    wo.status = WORK_ORDER_FSM.reject.to
    wo.rejectionReason = reason
    wo.log.push({ at: logTimestamp(), text: `Elutasítva — ${reason}` })
    return HttpResponse.json(wo)
  }),

  // ReopenWorkOrderCommand: halasztva|elutasitva → bejelentve — a hozzárendelés,
  // ütemezés és indokok törlődnek (a backend Reopen() aggregátum-tükre)
  http.put(`${BASE}/:id/reopen`, ({ params }) => {
    const wo = findWorkOrder(params.id as string)
    if (!wo) return notFound('Munkalap')
    const guard = guardTransition(WORK_ORDER_FSM, 'reopen', wo.status)
    if (guard) return guard

    wo.status = WORK_ORDER_FSM.reopen.to
    wo.assignmentType = null
    wo.assigneeName = null
    wo.scheduledAt = null
    wo.startedAt = null
    delete wo.postponementReason
    delete wo.rejectionReason
    wo.log.push({ at: logTimestamp(), text: 'Újranyitva — ismételt elbírálásra vár' })
    return HttpResponse.json(wo)
  }),
]

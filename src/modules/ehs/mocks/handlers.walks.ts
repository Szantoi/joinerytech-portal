import { http, HttpResponse } from 'msw'
import { EHS_API_BASE } from '../services/config'
import { SAFETY_WALK_FSM, WALK_FINDING_ALLOWED_STATUS } from '../services/fsm'
import type { AddFindingPayload, ScheduleWalkPayload } from '../services/safetyWalks'
import type { Capa } from '../services/capa'
import { TENANT_ID } from './seed'
import { getEhsDb, guardTransition, jsonError, notFound, toWalkListItem, type WalkRecord } from './db'

/** Bejárás-FSM + egységes CAPA handlerek (openapi SafetyWalks/CorrectiveActions, 10 végpont). */

const WALKS = `${EHS_API_BASE}/safety-walks`
const CAPAS = `${EHS_API_BASE}/corrective-actions`

function findWalk(id: string) {
  return getEhsDb().walks.find((w) => w.safetyWalkId === id)
}

export const walkHandlers = [
  http.get(WALKS, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const locationId = url.searchParams.get('locationId')
    let rows = getEhsDb().walks
    if (status) rows = rows.filter((w) => w.status === status)
    if (locationId) rows = rows.filter((w) => w.locationId === locationId)
    const items = [...rows]
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
      .map(toWalkListItem)
    return HttpResponse.json(items)
  }),

  http.get(`${WALKS}/:id`, ({ params }) => {
    const row = findWalk(params.id as string)
    return row ? HttpResponse.json(row) : notFound('Bejárás')
  }),

  // FSM belépő: ütemezés (Scheduled)
  http.post(WALKS, async ({ request }) => {
    const body = (await request.json()) as ScheduleWalkPayload
    const db = getEhsDb()
    if (!db.locations.some((l) => l.locationId === body.locationId && l.isActive)) {
      return jsonError(409, 'Conflict', 'A bejárás helyszíne nem aktív helyszín.')
    }
    const row: WalkRecord = {
      safetyWalkId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      locationId: body.locationId,
      scheduledDate: body.scheduledDate,
      conductedBy: body.conductedBy,
      participants: body.participants ?? [],
      status: 'Scheduled',
      findings: [],
    }
    db.walks.push(row)
    return HttpResponse.json({ id: row.safetyWalkId }, { status: 201 })
  }),

  // FSM: Scheduled → InProgress
  http.post(`${WALKS}/:id/start`, ({ params }) => {
    const row = findWalk(params.id as string)
    if (!row) return notFound('Bejárás')
    const guard = guardTransition(SAFETY_WALK_FSM, 'start', row.status)
    if (guard) return guard
    row.status = 'InProgress'
    row.startedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // Megállapítás rögzítése — csak InProgress alatt; opcionális CAPA-generálás
  http.post(`${WALKS}/:id/findings`, async ({ params, request }) => {
    const db = getEhsDb()
    const row = findWalk(params.id as string)
    if (!row) return notFound('Bejárás')
    if (row.status !== WALK_FINDING_ALLOWED_STATUS) {
      return jsonError(
        409, 'Conflict',
        `Megállapítás csak „InProgress" állapotú bejáráshoz rögzíthető — jelenlegi: „${row.status}".`,
      )
    }
    const body = (await request.json()) as AddFindingPayload
    const findingId = crypto.randomUUID()
    let correctiveActionId: string | null = null

    // Unified CAPA: requiresAction + felelős + határidő → intézkedés ugyanabban a táblában
    if (body.requiresAction && body.capaAssignedTo && body.capaDueDate) {
      const capa: Capa = {
        correctiveActionId: crypto.randomUUID(),
        tenantId: TENANT_ID,
        source: 'SafetyWalk',
        sourceId: row.safetyWalkId,
        findingId,
        description: body.capaDescription ?? body.description,
        assignedTo: body.capaAssignedTo,
        dueDate: body.capaDueDate,
        completedAt: null,
        isCompleted: false,
      }
      db.capas.push(capa)
      correctiveActionId = capa.correctiveActionId
    }

    row.findings.push({
      findingId,
      description: body.description,
      severity: body.severity,
      requiresAction: body.requiresAction,
      correctiveActionId,
      recordedAt: new Date().toISOString(),
    })
    return HttpResponse.json({ findingId, correctiveActionId }, { status: 201 })
  }),

  // FSM: InProgress → ActionRequired | Closed (a megállapításoktól függően)
  http.post(`${WALKS}/:id/complete`, ({ params }) => {
    const row = findWalk(params.id as string)
    if (!row) return notFound('Bejárás')
    const guard = guardTransition(SAFETY_WALK_FSM, 'complete', row.status)
    if (guard) return guard
    const needsAction = row.findings.some((f) => f.requiresAction)
    row.status = needsAction ? 'ActionRequired' : 'Closed'
    row.completedAt = new Date().toISOString()
    if (!needsAction) row.closedAt = row.completedAt
    return HttpResponse.json({ status: row.status })
  }),

  // FSM: ActionRequired → Closed — guard: minden kapcsolt CAPA teljesítve
  http.post(`${WALKS}/:id/close`, ({ params }) => {
    const db = getEhsDb()
    const row = findWalk(params.id as string)
    if (!row) return notFound('Bejárás')
    const guard = guardTransition(SAFETY_WALK_FSM, 'close', row.status)
    if (guard) return guard
    const openCapas = db.capas.filter(
      (c) => c.source === 'SafetyWalk' && c.sourceId === row.safetyWalkId && !c.isCompleted,
    )
    if (openCapas.length > 0) {
      return jsonError(
        409, 'Conflict',
        `A bejárás nem zárható le: ${openCapas.length} nyitott intézkedés (CAPA) tartozik hozzá.`,
      )
    }
    row.status = 'Closed'
    row.closedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // FSM: Scheduled → Cancelled
  http.post(`${WALKS}/:id/cancel`, ({ params }) => {
    const row = findWalk(params.id as string)
    if (!row) return notFound('Bejárás')
    const guard = guardTransition(SAFETY_WALK_FSM, 'cancel', row.status)
    if (guard) return guard
    row.status = 'Cancelled'
    row.cancelledAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Egységes CAPA tábla ───────────────────────────────────────────────────
  http.get(CAPAS, ({ request }) => {
    const url = new URL(request.url)
    const completed = url.searchParams.get('completed')
    const source = url.searchParams.get('source')
    const sourceId = url.searchParams.get('sourceId')
    const assignedTo = url.searchParams.get('assignedTo')

    let rows = getEhsDb().capas
    if (completed !== null) rows = rows.filter((c) => c.isCompleted === (completed === 'true'))
    if (source) rows = rows.filter((c) => c.source === source)
    if (sourceId) rows = rows.filter((c) => c.sourceId === sourceId)
    if (assignedTo) rows = rows.filter((c) => c.assignedTo === assignedTo)
    const items = [...rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return HttpResponse.json(items)
  }),

  http.post(`${CAPAS}/:id/complete`, ({ params }) => {
    const row = getEhsDb().capas.find((c) => c.correctiveActionId === params.id)
    if (!row) return notFound('Intézkedés')
    if (row.isCompleted) return jsonError(409, 'Conflict', 'Az intézkedés már teljesítve van.')
    row.isCompleted = true
    row.completedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]

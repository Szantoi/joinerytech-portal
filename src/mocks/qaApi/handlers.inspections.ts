import { http, HttpResponse } from 'msw'
import { QA_API_BASE } from '../../services/qa/config'
import {
  INSPECTION_FSM, failNotesBlockReason, isInspectionOpen,
  type InspectionStatus,
} from '../../services/qa/fsm'
import type { FailureNoteInput } from '../../services/qa/inspections'
import {
  getQaDb, guardTransition, isoTimestamp, jsonError, notFound, serveInspection,
  type InspectionSeed,
} from './db'

/**
 * Átvizsgálás handlerek — lista, részlet és FSM-átmenetek a backend
 * InspectionEndpoints útvonalain (POST /:id/start, /:id/complete/pass,
 * /:id/complete/fail). Tiltott átmenet → 409 (közös guard-tábla:
 * services/qa/fsm.ts); selejtezés hibajegyzet nélkül → 400
 * (`CompleteWithFail()` tükör); a válasz a frissített DTO (backend-gap: a
 * valós végpontok 204-et adnak). A `blocking`/`openTickets` mezők
 * kiszolgáláskor számítottak (serveInspection — calc-tükör).
 */

const BASE = `${QA_API_BASE}/inspections`

function findInspection(id: string | readonly string[]): InspectionSeed | undefined {
  return getQaDb().inspections.find((i) => i.id === id)
}

export const inspectionHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as InspectionStatus | null
    const open = url.searchParams.get('open')
    const q = url.searchParams.get('q')?.toLowerCase()

    let rows = getQaDb().inspections
    if (status) rows = rows.filter((i) => i.status === status)
    if (open === 'true') rows = rows.filter((i) => isInspectionOpen(i.status))
    if (q) {
      rows = rows.filter((i) =>
        [i.checkpointName, i.orderRef ?? '', i.productName ?? '', i.id]
          .some((field) => field.toLowerCase().includes(q)),
      )
    }
    // legfrissebb tervezett időpont elöl
    const sorted = [...rows].sort((a, b) => b.plannedAt.localeCompare(a.plannedAt))
    return HttpResponse.json(sorted.map(serveInspection))
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const inspection = findInspection(params.id as string)
    return inspection ? HttpResponse.json(serveInspection(inspection)) : notFound('Átvizsgálás')
  }),

  // Start(): nyitott → folyamatban
  http.post(`${BASE}/:id/start`, ({ params }) => {
    const inspection = findInspection(params.id as string)
    if (!inspection) return notFound('Átvizsgálás')
    const guard = guardTransition(INSPECTION_FSM, 'start', inspection.status)
    if (guard) return guard

    inspection.status = INSPECTION_FSM.start.to
    inspection.startedAt = isoTimestamp()
    return HttpResponse.json(serveInspection(inspection))
  }),

  // CompleteWithPass(): folyamatban → megfelelt (opcionális megjegyzéssel)
  http.post(`${BASE}/:id/complete/pass`, async ({ params, request }) => {
    const inspection = findInspection(params.id as string)
    if (!inspection) return notFound('Átvizsgálás')
    const guard = guardTransition(INSPECTION_FSM, 'pass', inspection.status)
    if (guard) return guard

    const body = (await request.json()) as { notes?: string } | null
    inspection.status = INSPECTION_FSM.pass.to
    inspection.notes = body?.notes?.trim() || null
    inspection.completedAt = isoTimestamp()
    return HttpResponse.json(serveInspection(inspection))
  }),

  // CompleteWithFail(): folyamatban → selejt — HIBAJEGYZET NÉLKÜL 400 (aggregátum-tükör)
  http.post(`${BASE}/:id/complete/fail`, async ({ params, request }) => {
    const inspection = findInspection(params.id as string)
    if (!inspection) return notFound('Átvizsgálás')
    const guard = guardTransition(INSPECTION_FSM, 'fail', inspection.status)
    if (guard) return guard

    const body = (await request.json()) as
      | { failureNotes?: FailureNoteInput[]; notes?: string }
      | null
    const notesBlock = failNotesBlockReason(body?.failureNotes?.length ?? 0)
    if (notesBlock) return jsonError(400, 'BadRequest', notesBlock)
    if (body!.failureNotes!.some((n) => !n.description?.trim())) {
      return jsonError(400, 'BadRequest', 'Minden hibajegyzethez kötelező a leírás.')
    }

    inspection.status = INSPECTION_FSM.fail.to
    inspection.failureNotes = body!.failureNotes!.map((n) => ({
      failureType: n.failureType,
      description: n.description.trim(),
      photoUrl: n.photoUrl ?? null,
    }))
    inspection.notes = body?.notes?.trim() || null
    inspection.completedAt = isoTimestamp()
    return HttpResponse.json(serveInspection(inspection))
  }),
]

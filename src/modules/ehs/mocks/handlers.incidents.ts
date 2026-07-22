import { http, HttpResponse } from 'msw'
import { EHS_API_BASE } from '../services/config'
import { INCIDENT_FSM } from '../services/fsm'
import type { IncidentTransitionPayloads, IncidentType } from '../services/incidents'
import { TENANT_ID } from './seed'
import { getEhsDb, guardTransition, jsonError, notFound, toIncidentDto, type IncidentRecord } from './db'

/** Balesetek/események handlerek — lista, részlet, FSM-átmenetek + wizard-bejelentés. */

const BASE = `${EHS_API_BASE}/incidents`

function findIncident(id: string | readonly string[]) {
  return getEhsDb().incidents.find((i) => i.incidentId === id)
}

/** A bejelentő wizard event-payloadja (stores/incidentDraftStore). */
interface IncidentEventBody {
  payload: {
    reporterId: string
    incidentType: 'near-miss' | 'injury' | 'property' | null
    locationId: string | null
    timestamp: string
    description: string
  }
}

const WIZARD_TYPE_MAP: Record<string, IncidentType> = {
  'injury': 'Accident',
  'near-miss': 'NearMiss',
  'property': 'HazardousCondition',
}

export const incidentHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)

    let rows = getEhsDb().incidents
    if (status) rows = rows.filter((i) => i.status === status)
    if (type) rows = rows.filter((i) => i.incidentType === type)
    // legfrissebb elöl — a dashboard "legutóbbi események" nézetéhez
    const sorted = [...rows].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(toIncidentDto)
    return HttpResponse.json({ items, totalCount: rows.length, page, pageSize })
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const row = findIncident(params.id as string)
    return row ? HttpResponse.json(toIncidentDto(row)) : notFound('Esemény')
  }),

  // FSM: Reported/Reopened → Investigated
  http.put(`${BASE}/:id/investigate`, async ({ params, request }) => {
    const row = findIncident(params.id as string)
    if (!row) return notFound('Esemény')
    const guard = guardTransition(INCIDENT_FSM, 'investigate', row.status)
    if (guard) return guard
    const body = (await request.json()) as IncidentTransitionPayloads['investigate']
    row.status = 'Investigated'
    row.investigatedBy = body.investigatedBy
    row.investigatedAt = new Date().toISOString()
    return HttpResponse.json(toIncidentDto(row))
  }),

  // FSM: Investigated → CorrectiveActionPlanned (+ egységes CAPA létrehozás)
  http.put(`${BASE}/:id/corrective-actions`, async ({ params, request }) => {
    const db = getEhsDb()
    const row = findIncident(params.id as string)
    if (!row) return notFound('Esemény')
    const guard = guardTransition(INCIDENT_FSM, 'addCorrectiveAction', row.status)
    if (guard) return guard
    const body = (await request.json()) as IncidentTransitionPayloads['addCorrectiveAction']
    db.capas.push({
      correctiveActionId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      source: 'esemeny',
      sourceId: row.incidentId,
      incidentId: row.incidentId,
      description: body.description,
      assignedTo: body.responsiblePerson,
      dueDate: body.dueDate,
      completedAt: null,
      isCompleted: false,
    })
    if (body.findings && body.rootCause) {
      row.investigation = { findings: body.findings, rootCause: body.rootCause }
    }
    row.status = 'CorrectiveActionPlanned'
    return HttpResponse.json(toIncidentDto(row))
  }),

  // FSM: CorrectiveActionPlanned → Closed
  http.put(`${BASE}/:id/close`, async ({ params, request }) => {
    const row = findIncident(params.id as string)
    if (!row) return notFound('Esemény')
    const guard = guardTransition(INCIDENT_FSM, 'close', row.status)
    if (guard) return guard
    await request.json() // closureNotes — a mock nem tárolja
    row.status = 'Closed'
    row.closedAt = new Date().toISOString()
    return HttpResponse.json(toIncidentDto(row))
  }),

  // FSM: Closed → Reopened
  http.put(`${BASE}/:id/reopen`, async ({ params, request }) => {
    const row = findIncident(params.id as string)
    if (!row) return notFound('Esemény')
    const guard = guardTransition(INCIDENT_FSM, 'reopen', row.status)
    if (guard) return guard
    await request.json() // reopenReason — a mock nem tárolja
    row.status = 'Reopened'
    row.closedAt = null
    return HttpResponse.json(toIncidentDto(row))
  }),

  // Wizard-bejelentés: POST /api/ehs/events → új Reported incidens a store-ban
  http.post(`${EHS_API_BASE}/events`, async ({ request }) => {
    const body = (await request.json()) as IncidentEventBody
    const p = body.payload
    if (!p?.incidentType || !p.description) {
      return jsonError(400, 'BadRequest', 'Hiányzó bejelentés-adatok.')
    }
    const db = getEhsDb()
    const location = db.locations.find((l) => l.locationId === p.locationId)
    const record: IncidentRecord = {
      incidentId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      incidentType: WIZARD_TYPE_MAP[p.incidentType] ?? 'NearMiss',
      incidentDate: p.timestamp,
      location: location?.name ?? 'Ismeretlen helyszín',
      description: p.description,
      severity: 3, // a gyors-bejelentőben nincs súlyosság-mező — kivizsgáláskor pontosítandó
      status: 'Reported',
      reportedBy: p.reporterId,
      reportedAt: new Date().toISOString(),
    }
    db.incidents.push(record)
    return HttpResponse.json(
      {
        eventId: record.incidentId,
        sequence: db.incidents.length,
        status: 'accepted',
        serverTimestamp: record.reportedAt,
      },
      { status: 201 },
    )
  }),
]

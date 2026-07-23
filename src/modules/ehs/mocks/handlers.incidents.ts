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
  eventId?: string
  type?: string
  payload?: {
    reporterId?: string
    incidentType?: 'near-miss' | 'injury' | 'property' | null
    locationId?: string | null
    timestamp?: string
    photoS3Key?: string | null
    description?: string
  }
}

// A backend ReportIncidentCommand validator hosszkorlátainak tükre.
const LOCATION_ID_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 2000
const PHOTO_S3_KEY_MAX_LENGTH = 500

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isNonEmptyUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value) && value !== EMPTY_UUID
}

function wizardEventResponse(record: IncidentRecord, sequence: number, status: 200 | 201) {
  return HttpResponse.json(
    {
      eventId: record.incidentId,
      sequence,
      status: 'accepted',
      serverTimestamp: record.reportedAt,
    },
    { status },
  )
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

  // Wizard-bejelentés: POST /api/ehs/events → új Reported incidens a store-ban.
  // A guard a legacy host ReportIncidentCommand validator kötelező minimumát
  // tükrözi (EventId/ReporterId GUID, type, locationId, hosszkorlátok), hogy a
  // mock mód ne lehessen zöld ott, ahol a valós backend 400-at adna.
  http.post(`${EHS_API_BASE}/events`, async ({ request }) => {
    const body = (await request.json()) as IncidentEventBody
    const p = body.payload
    if (
      !isNonEmptyUuid(body.eventId) ||
      body.type !== 'INCIDENT_REPORTED' ||
      !isNonEmptyUuid(p?.reporterId) ||
      !p?.incidentType ||
      !(p.incidentType in WIZARD_TYPE_MAP) ||
      typeof p.locationId !== 'string' ||
      !p.locationId.trim() ||
      p.locationId.length > LOCATION_ID_MAX_LENGTH ||
      typeof p.timestamp !== 'string' ||
      !p.timestamp.trim() ||
      typeof p.description !== 'string' ||
      !p.description.trim() ||
      p.description.length > DESCRIPTION_MAX_LENGTH ||
      (p.photoS3Key != null &&
        (typeof p.photoS3Key !== 'string' || p.photoS3Key.length > PHOTO_S3_KEY_MAX_LENGTH))
    ) {
      return jsonError(400, 'BadRequest', 'Hiányzó vagy érvénytelen bejelentés-adatok.')
    }
    const db = getEhsDb()

    // Az event ID az idempotencia-kulcs: ismételt POST nem hoz létre új incidenst.
    const existingIndex = db.incidents.findIndex((incident) => incident.incidentId === body.eventId)
    if (existingIndex >= 0) {
      return wizardEventResponse(db.incidents[existingIndex], existingIndex + 1, 200)
    }

    const location = db.locations.find((l) => l.locationId === p.locationId)
    const record: IncidentRecord = {
      incidentId: body.eventId,
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
    return wizardEventResponse(record, db.incidents.length, 201)
  }),
]

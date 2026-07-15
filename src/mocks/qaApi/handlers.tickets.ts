import { http, HttpResponse } from 'msw'
import { QA_API_BASE } from '../../services/qa/config'
import {
  TICKET_FSM, escalatePriorityBlockReason, escalateStatusBlockReason,
  isTicketOpen, resolveActionsBlockReason,
  type TicketPriority, type TicketStatus,
} from '../../services/qa/fsm'
import type {
  ResolutionActionInput, Ticket, TicketCreateInput,
} from '../../services/qa/tickets'
import { MOCK_REPORTER } from './seed'
import { getQaDb, guardTransition, isoTimestamp, jsonError, notFound } from './db'

/**
 * Hibajegy handlerek — MSW-FIRST kontraktus-előkép (a backend Ticket
 * aggregátumnak NINCS REST végpontja — dokumentált gap): lista, részlet,
 * létrehozás (CreateTicketCommand), FSM-átmenetek (Assign/Start/Resolve/
 * Reject/Reopen command-tükrök) és prioritás-eszkaláció (EscalatePriority).
 * Tiltott átmenet → 409 (közös guard-tábla: services/qa/fsm.ts);
 * hiányzó kötelező payload → 400; eszkaláció-szabálysértés → 409.
 */

const BASE = `${QA_API_BASE}/tickets`

/** A backend rang-guard hibaüzenetéhez lokalizált címkék (fsm-oldali tükör). */
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  alacsony: 'alacsony', kozepes: 'közepes', magas: 'magas', kritikus: 'kritikus',
}

function findTicket(id: string | readonly string[]): Ticket | undefined {
  return getQaDb().tickets.find((t) => t.id === id)
}

/** Új hibajegy-azonosító a seed-formátumban (QAT-3xx folytatólagos). */
function nextTicketId(): string {
  const nums = getQaDb().tickets
    .map((t) => Number(t.id.replace('QAT-', '')))
    .filter((n) => !Number.isNaN(n))
  return `QAT-${Math.max(0, ...nums) + 1}`
}

export const ticketHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as TicketStatus | null
    const priority = url.searchParams.get('priority') as TicketPriority | null
    const inspectionId = url.searchParams.get('inspectionId')
    const open = url.searchParams.get('open')
    const q = url.searchParams.get('q')?.toLowerCase()

    let rows = getQaDb().tickets
    if (status) rows = rows.filter((t) => t.status === status)
    if (priority) rows = rows.filter((t) => t.priority === priority)
    if (inspectionId) rows = rows.filter((t) => t.inspectionId === inspectionId)
    if (open === 'true') rows = rows.filter((t) => isTicketOpen(t.status))
    if (q) {
      rows = rows.filter((t) =>
        [t.title, t.productName ?? '', t.orderRef ?? '', t.id]
          .some((field) => field.toLowerCase().includes(q)),
      )
    }
    // legfrissebb bejelentés elöl
    const sorted = [...rows].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const ticket = findTicket(params.id as string)
    return ticket ? HttpResponse.json(ticket) : notFound('Hibajegy')
  }),

  // CreateTicketCommand tükör — a hibajegy mindig bejelentve-ként indul;
  // cím 5–200 karakter, leírás min. 10 karakter (aggregátum-guard tükrök)
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Partial<TicketCreateInput> | null
    const title = body?.title?.trim() ?? ''
    const description = body?.description?.trim() ?? ''
    if (title.length < 5 || title.length > 200) {
      return jsonError(400, 'BadRequest', 'A hibajegy címe 5–200 karakter kell legyen.')
    }
    if (description.length < 10) {
      return jsonError(400, 'BadRequest', 'A hibajegy leírása legalább 10 karakter kell legyen.')
    }

    // kapcsolt átvizsgálás: léteznie kell; a ref denormalizált (rule-6 keresztkötés)
    let inspectionRef: string | null = null
    if (body?.inspectionId) {
      const inspection = getQaDb().inspections.find((i) => i.id === body.inspectionId)
      if (!inspection) return notFound('Átvizsgálás')
      inspectionRef = inspection.checkpointName
    }

    const ticket: Ticket = {
      id: nextTicketId(),
      ticketType: body?.ticketType ?? 'javitas',
      status: 'bejelentve',
      priority: body?.priority ?? 'kozepes',
      orderRef: body?.orderRef ?? null,
      productName: body?.productName ?? null,
      inspectionId: body?.inspectionId ?? null,
      inspectionRef,
      title, description,
      reportedBy: MOCK_REPORTER,
      assigneeName: null,
      resolutionNotes: null, resolutionActions: [],
      reportedAt: isoTimestamp(), assignedAt: null, startedAt: null, resolvedAt: null,
    }
    getQaDb().tickets.push(ticket)
    return HttpResponse.json(ticket, { status: 201 })
  }),

  // AssignTicketCommand: bejelentve → kiosztva, felelős kötelező
  http.put(`${BASE}/:id/assign`, async ({ params, request }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')
    const guard = guardTransition(TICKET_FSM, 'assign', ticket.status)
    if (guard) return guard

    const body = (await request.json()) as { assigneeName?: string } | null
    const name = body?.assigneeName?.trim()
    if (!name) return jsonError(400, 'BadRequest', 'A felelős neve kötelező.')

    ticket.status = TICKET_FSM.assign.to
    ticket.assigneeName = name
    ticket.assignedAt = isoTimestamp()
    return HttpResponse.json(ticket)
  }),

  // StartTicketCommand: kiosztva → folyamatban
  http.put(`${BASE}/:id/start`, ({ params }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')
    const guard = guardTransition(TICKET_FSM, 'start', ticket.status)
    if (guard) return guard

    ticket.status = TICKET_FSM.start.to
    ticket.startedAt = isoTimestamp()
    return HttpResponse.json(ticket)
  }),

  // ResolveTicketCommand: folyamatban → megoldva — INTÉZKEDÉS NÉLKÜL 400 (Resolve() tükör)
  http.put(`${BASE}/:id/resolve`, async ({ params, request }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')
    const guard = guardTransition(TICKET_FSM, 'resolve', ticket.status)
    if (guard) return guard

    const body = (await request.json()) as
      | { resolutionActions?: ResolutionActionInput[]; resolutionNotes?: string }
      | null
    const actionsBlock = resolveActionsBlockReason(body?.resolutionActions?.length ?? 0)
    if (actionsBlock) return jsonError(400, 'BadRequest', actionsBlock)
    if (body!.resolutionActions!.some((a) => !a.description?.trim())) {
      return jsonError(400, 'BadRequest', 'Minden intézkedéshez kötelező a leírás.')
    }

    ticket.status = TICKET_FSM.resolve.to
    ticket.resolutionActions = body!.resolutionActions!.map((a) => ({
      actionType: a.actionType,
      description: a.description.trim(),
      costAmount: a.costAmount ?? 0,
    }))
    ticket.resolutionNotes = body?.resolutionNotes?.trim() || null
    ticket.resolvedAt = isoTimestamp()
    return HttpResponse.json(ticket)
  }),

  // RejectTicketCommand: folyamatban → elutasitva, indok kötelező (→ resolutionNotes)
  http.put(`${BASE}/:id/reject`, async ({ params, request }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')
    const guard = guardTransition(TICKET_FSM, 'reject', ticket.status)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string } | null
    const reason = body?.reason?.trim()
    if (!reason) return jsonError(400, 'BadRequest', 'Az elutasítás indoka kötelező.')

    ticket.status = TICKET_FSM.reject.to
    // a backend Reject(reason) az indokot a ResolutionNotes mezőbe írja (tükör)
    ticket.resolutionNotes = reason
    return HttpResponse.json(ticket)
  }),

  // ReopenTicketCommand: elutasitva → bejelentve — a hozzárendelés, kezdés és
  // megjegyzés törlődik (a backend Reopen() aggregátum-tükre)
  http.put(`${BASE}/:id/reopen`, ({ params }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')
    const guard = guardTransition(TICKET_FSM, 'reopen', ticket.status)
    if (guard) return guard

    ticket.status = TICKET_FSM.reopen.to
    ticket.assigneeName = null
    ticket.assignedAt = null
    ticket.startedAt = null
    ticket.resolutionNotes = null
    return HttpResponse.json(ticket)
  }),

  // EscalatePriorityCommand tükör — státusz- és rang-guardolt, de NEM FSM-átmenet
  http.put(`${BASE}/:id/escalate`, async ({ params, request }) => {
    const ticket = findTicket(params.id as string)
    if (!ticket) return notFound('Hibajegy')

    const statusBlock = escalateStatusBlockReason(ticket.status)
    if (statusBlock) return jsonError(409, 'Conflict', statusBlock)

    const body = (await request.json()) as { priority?: TicketPriority } | null
    if (!body?.priority || !(body.priority in PRIORITY_LABELS)) {
      return jsonError(400, 'BadRequest', 'Az új prioritás kötelező.')
    }
    const rankBlock = escalatePriorityBlockReason(ticket.priority, body.priority, PRIORITY_LABELS)
    if (rankBlock) return jsonError(409, 'Conflict', rankBlock)

    ticket.priority = body.priority
    return HttpResponse.json(ticket)
  }),
]

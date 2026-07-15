import { http, HttpResponse } from 'msw'
import { CRM_API_BASE } from '../../services/crm/config'
import { LEAD_FSM, type LeadStatus } from '../../services/crm/fsm'
import type { LeadTransitionPayloads, SimpleLeadAction } from '../../services/crm/leads'
import type { AddActivityPayload } from '../../services/crm/activities'
import type { Opportunity } from '../../services/crm/opportunities'
import { activityTimestamp, getCrmDb, guardTransition, jsonError, notFound } from './db'

/** Lead handlerek — lista, részlet, FSM-átmenetek, konvertálás, napló. */

const BASE = `${CRM_API_BASE}/leads`

function findLead(id: string | readonly string[]) {
  return getCrmDb().leads.find((l) => l.id === id)
}

/** Egyszerű FSM-átmenet: guard → státusz + napló-bejegyzés → frissült lead. */
function makeTransitionHandler(action: SimpleLeadAction, logText: (note?: string) => string) {
  return http.put(`${BASE}/:id/${action}`, async ({ params, request }) => {
    const lead = findLead(params.id as string)
    if (!lead) return notFound('Lead')
    const guard = guardTransition(LEAD_FSM, action, lead.status)
    if (guard) return guard

    const body = (await request.json()) as LeadTransitionPayloads[SimpleLeadAction] | null
    if (action === 'discard') {
      const reason = (body as LeadTransitionPayloads['discard'] | null)?.reason?.trim()
      if (!reason) return jsonError(400, 'BadRequest', 'Az elvetés indoka kötelező.')
      lead.lostReason = reason
    }
    lead.status = LEAD_FSM[action].to
    lead.activities.push({
      at: activityTimestamp(),
      kind: 'megjegyzes',
      who: lead.owner,
      text: logText(body && 'note' in body ? body.note : undefined),
    })
    return HttpResponse.json(lead)
  })
}

/** Következő lehetőség-azonosító (OPP-2426-NNN). */
function nextOppId(opps: Opportunity[]): string {
  const max = opps.reduce((m, o) => {
    const n = Number(o.id.split('-').pop())
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return `OPP-2426-${String(max + 1).padStart(3, '0')}`
}

export const leadHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as LeadStatus | null
    const q = url.searchParams.get('q')?.toLowerCase()

    let rows = getCrmDb().leads
    if (status) rows = rows.filter((l) => l.status === status)
    if (q) rows = rows.filter((l) => `${l.contact} ${l.company} ${l.title} ${l.city}`.toLowerCase().includes(q))
    // legfrissebb elöl
    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const lead = findLead(params.id as string)
    return lead ? HttpResponse.json(lead) : notFound('Lead')
  }),

  // FSM-átmenetek (uj→kapcsolat→minosites→nurturing, +elvetve)
  makeTransitionHandler('contact', (note) => note ?? 'Kapcsolatfelvétel megtörtént.'),
  makeTransitionHandler('qualify', (note) => note ?? 'Lead minősítve.'),
  makeTransitionHandler('nurture', (note) => note ?? 'Nurturing-listára téve.'),
  makeTransitionHandler('discard', (note) => note ?? 'Lead elvetve.'),

  // Konvertálás: minosites/nurturing → konvertalva + lehetőség-csonk létrehozás
  http.post(`${BASE}/:id/convert`, ({ params }) => {
    const db = getCrmDb()
    const lead = findLead(params.id as string)
    if (!lead) return notFound('Lead')
    const guard = guardTransition(LEAD_FSM, 'convert', lead.status)
    if (guard) return guard

    const opportunityId = nextOppId(db.opps)
    const opp: Opportunity = {
      id: opportunityId,
      status: 'nyitott',
      owner: lead.owner,
      customer: lead.company || lead.contact,
      contact: lead.contact,
      phone: lead.phone,
      city: lead.city,
      title: lead.title,
      value: lead.estValue,
      source: lead.source,
      fromLead: lead.id,
      expectedClose: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isNewCustomer: lead.company === '',
      createdAt: new Date().toISOString().slice(0, 10),
      activities: [{
        at: activityTimestamp(),
        kind: 'megjegyzes',
        who: lead.owner,
        text: `Lehetőség létrehozva ${lead.id}-ból.`,
      }],
    }
    db.opps.push(opp)

    lead.status = 'konvertalva'
    lead.oppId = opportunityId
    lead.activities.push({
      at: activityTimestamp(),
      kind: 'megjegyzes',
      who: lead.owner,
      text: `Konvertálva lehetőséggé: ${opportunityId}.`,
    })
    return HttpResponse.json({ lead, opportunityId }, { status: 201 })
  }),

  // Tevékenységnapló-bejegyzés
  http.post(`${BASE}/:id/activities`, async ({ params, request }) => {
    const lead = findLead(params.id as string)
    if (!lead) return notFound('Lead')
    const body = (await request.json()) as AddActivityPayload
    if (!body?.text?.trim()) return jsonError(400, 'BadRequest', 'A bejegyzés szövege kötelező.')
    lead.activities.push({
      at: activityTimestamp(),
      kind: body.kind,
      who: body.who,
      text: body.text,
    })
    return HttpResponse.json(lead, { status: 201 })
  }),
]

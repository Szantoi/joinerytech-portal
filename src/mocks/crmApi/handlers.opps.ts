import { http, HttpResponse } from 'msw'
import { CRM_API_BASE } from '../../services/crm/config'
import { OPP_FSM, OPP_OPEN_STAGES, type OppAction, type OppStatus } from '../../services/crm/fsm'
import type { OppTransitionPayloads } from '../../services/crm/opportunities'
import type { AddActivityPayload } from '../../services/crm/activities'
import { activityTimestamp, getCrmDb, guardTransition, jsonError, notFound } from './db'

/** Lehetőség handlerek — lista, részlet, FSM-átmenetek, ajánlat-csonk, napló. */

const BASE = `${CRM_API_BASE}/opportunities`

function findOpp(id: string | readonly string[]) {
  return getCrmDb().opps.find((o) => o.id === id)
}

/** Akció → URL szegmens (a services/crm/opportunities.ts route-térképének tükre). */
const ROUTES: Record<OppAction, string> = {
  startDiscovery: 'start-discovery',
  startProposal: 'start-proposal',
  sendQuote: 'send-quote',
  negotiate: 'negotiate',
  win: 'win',
  lose: 'lose',
}

const TRANSITION_LOG: Record<OppAction, string> = {
  startDiscovery: 'Igényfelmérés elindítva.',
  startProposal: 'Ajánlat-összeállítás elindítva.',
  sendQuote: 'Ajánlat kiküldve.',
  negotiate: 'Tárgyalási fázisba lépett.',
  win: 'Megnyert — szerződés aláírva.',
  lose: 'Elveszett.',
}

function makeTransitionHandler(action: OppAction) {
  return http.put(`${BASE}/:id/${ROUTES[action]}`, async ({ params, request }) => {
    const opp = findOpp(params.id as string)
    if (!opp) return notFound('Lehetőség')
    const guard = guardTransition(OPP_FSM, action, opp.status)
    if (guard) return guard

    const body = (await request.json()) as OppTransitionPayloads[OppAction] | null
    if (action === 'lose') {
      const reason = (body as OppTransitionPayloads['lose'] | null)?.reason?.trim()
      if (!reason) return jsonError(400, 'BadRequest', 'Az elvesztés indoka kötelező.')
      opp.lostReason = reason
      opp.lostAt = new Date().toISOString().slice(0, 10)
    }
    if (action === 'win') {
      opp.wonAt = new Date().toISOString().slice(0, 10)
    }
    opp.status = OPP_FSM[action].to
    opp.activities.push({
      at: activityTimestamp(),
      kind: 'megjegyzes',
      who: opp.owner,
      text: (body && 'note' in body && body.note) || TRANSITION_LOG[action],
    })
    return HttpResponse.json(opp)
  })
}

/** Következő ajánlat-azonosító (Q-2426-NNN) — draft ajánlat-csonk. */
function nextQuoteId(): string {
  const max = getCrmDb().opps.reduce((m, o) => {
    const n = Number(o.quoteId?.split('-').pop())
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 58) // a statikus QUOTES mock legmagasabb sorszáma után folytat
  return `Q-2426-${String(max + 1).padStart(3, '0')}`
}

export const oppHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') as OppStatus | null
    const open = url.searchParams.get('open')

    let rows = getCrmDb().opps
    if (status) rows = rows.filter((o) => o.status === status)
    if (open === 'true') rows = rows.filter((o) => (OPP_OPEN_STAGES as readonly string[]).includes(o.status))
    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const opp = findOpp(params.id as string)
    return opp ? HttpResponse.json(opp) : notFound('Lehetőség')
  }),

  // FSM-átmenetek (nyitott→…→targyalas→megnyert, +elveszett)
  ...(Object.keys(OPP_FSM) as OppAction[]).map(makeTransitionHandler),

  // oppCreateQuote handoff: draft ajánlat-csonk (Sales modul előképe)
  http.post(`${BASE}/:id/quote`, ({ params }) => {
    const opp = findOpp(params.id as string)
    if (!opp) return notFound('Lehetőség')
    if (!(OPP_OPEN_STAGES as readonly string[]).includes(opp.status)) {
      return jsonError(409, 'Conflict', 'Lezárt lehetőséghez nem hozható létre ajánlat.')
    }
    if (opp.quoteId) {
      return jsonError(409, 'Conflict', `A lehetőséghez már tartozik ajánlat: ${opp.quoteId}.`)
    }
    const quoteId = nextQuoteId()
    opp.quoteId = quoteId
    opp.activities.push({
      at: activityTimestamp(),
      kind: 'megjegyzes',
      who: opp.owner,
      text: `Ajánlat-piszkozat létrehozva: ${quoteId}.`,
    })
    return HttpResponse.json({ opportunity: opp, quoteId }, { status: 201 })
  }),

  // Tevékenységnapló-bejegyzés
  http.post(`${BASE}/:id/activities`, async ({ params, request }) => {
    const opp = findOpp(params.id as string)
    if (!opp) return notFound('Lehetőség')
    const body = (await request.json()) as AddActivityPayload
    if (!body?.text?.trim()) return jsonError(400, 'BadRequest', 'A bejegyzés szövege kötelező.')
    opp.activities.push({
      at: activityTimestamp(),
      kind: body.kind,
      who: body.who,
      text: body.text,
    })
    return HttpResponse.json(opp, { status: 201 })
  }),
]

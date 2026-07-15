import { http, HttpResponse } from 'msw'
import { EHS_API_BASE, EXPIRY_WINDOW_DAYS } from '../../services/ehs/config'
import { PPE_ISSUANCE_FSM } from '../../services/ehs/fsm'
import type { IssuePpePayload, PpeItem } from '../../services/ehs/ppe'
import { TENANT_ID } from './seed'
import { getEhsDb, guardTransition, jsonError, notFound, toIssuanceDto, type PpeIssuanceRecord } from './db'

/** EVE/PPE katalógus + kiadás-FSM handlerek (openapi PpeItems/PpeIssuances, 13 végpont). */

const ITEMS = `${EHS_API_BASE}/ppe-items`
const ISSUANCES = `${EHS_API_BASE}/ppe-issuances`

const MS_PER_DAY = 24 * 60 * 60 * 1000

function findItem(id: string) {
  return getEhsDb().ppeItems.find((i) => i.ppeItemId === id)
}

function findIssuance(id: string) {
  return getEhsDb().ppeIssuances.find((i) => i.issuanceId === id)
}

/** expiresAt kihagyva → a katalógus-elem defaultLifetimeMonths-éből származtatva. */
function deriveExpiry(item: PpeItem, explicit?: string | null): string | null {
  if (explicit) return explicit
  if (!item.defaultLifetimeMonths) return null
  const d = new Date()
  d.setMonth(d.getMonth() + item.defaultLifetimeMonths)
  return d.toISOString()
}

type ItemBody = Pick<PpeItem, 'name' | 'category' | 'standardRef' | 'defaultLifetimeMonths'>

export const ppeHandlers = [
  // ── Katalógus ─────────────────────────────────────────────────────────────
  http.get(ITEMS, ({ request }) => {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('activeOnly') === 'true'
    const category = url.searchParams.get('category')
    let rows = getEhsDb().ppeItems
    if (activeOnly) rows = rows.filter((i) => i.isActive)
    if (category) rows = rows.filter((i) => i.category === category)
    return HttpResponse.json(rows)
  }),

  http.post(ITEMS, async ({ request }) => {
    const body = (await request.json()) as ItemBody
    const row: PpeItem = {
      ppeItemId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      name: body.name,
      category: body.category,
      standardRef: body.standardRef ?? null,
      defaultLifetimeMonths: body.defaultLifetimeMonths ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    getEhsDb().ppeItems.push(row)
    return HttpResponse.json({ id: row.ppeItemId }, { status: 201 })
  }),

  http.get(`${ITEMS}/:id`, ({ params }) => {
    const row = findItem(params.id as string)
    return row ? HttpResponse.json(row) : notFound('EVE tétel')
  }),

  http.put(`${ITEMS}/:id`, async ({ params, request }) => {
    const row = findItem(params.id as string)
    if (!row) return notFound('EVE tétel')
    const body = (await request.json()) as ItemBody
    Object.assign(row, body)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${ITEMS}/:id/deactivate`, ({ params }) => {
    const row = findItem(params.id as string)
    if (!row) return notFound('EVE tétel')
    if (!row.isActive) return jsonError(409, 'Conflict', 'A tétel már inaktív.')
    row.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Kiadások ──────────────────────────────────────────────────────────────
  http.get(ISSUANCES, ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const status = url.searchParams.get('status')
    let rows = getEhsDb().ppeIssuances
    if (employeeId) rows = rows.filter((i) => i.employeeId === employeeId)
    if (status) rows = rows.filter((i) => i.status === status)
    return HttpResponse.json(rows.map(toIssuanceDto))
  }),

  // Dashboard: kint lévő, az ablakon belül lejáró (vagy már lejárt) kiadások
  http.get(`${ISSUANCES}/expiring`, ({ request }) => {
    const url = new URL(request.url)
    const withinDays = Number(url.searchParams.get('withinDays') ?? EXPIRY_WINDOW_DAYS)
    const limit = Date.now() + withinDays * MS_PER_DAY
    const items = getEhsDb().ppeIssuances
      .filter((i) => (i.status === 'Issued' || i.status === 'Acknowledged') && i.expiresAt)
      .filter((i) => new Date(i.expiresAt!).getTime() <= limit)
      .map(toIssuanceDto)
    return HttpResponse.json(items)
  }),

  http.get(`${ISSUANCES}/by-employee/:employeeId`, ({ params }) => {
    const items = getEhsDb().ppeIssuances
      .filter((i) => i.employeeId === params.employeeId)
      .map(toIssuanceDto)
    return HttpResponse.json(items)
  }),

  http.get(`${ISSUANCES}/:id`, ({ params }) => {
    const row = findIssuance(params.id as string)
    return row ? HttpResponse.json(toIssuanceDto(row)) : notFound('Kiadás')
  }),

  // FSM belépő: kiadás rögzítése (Issued)
  http.post(ISSUANCES, async ({ request }) => {
    const body = (await request.json()) as IssuePpePayload
    const item = findItem(body.ppeItemId)
    if (!item) return notFound('EVE tétel')
    if (!item.isActive) return jsonError(409, 'Conflict', 'Inaktív EVE tétel nem adható ki.')
    const row: PpeIssuanceRecord = {
      issuanceId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      employeeId: body.employeeId,
      ppeItemId: body.ppeItemId,
      issuedAt: new Date().toISOString(),
      issuedBy: body.issuedBy,
      quantity: body.quantity,
      expiresAt: deriveExpiry(item, body.expiresAt),
      status: 'Issued',
    }
    getEhsDb().ppeIssuances.push(row)
    return HttpResponse.json({ id: row.issuanceId }, { status: 201 })
  }),

  // FSM: Issued → Acknowledged
  http.post(`${ISSUANCES}/:id/acknowledge`, ({ params }) => {
    const row = findIssuance(params.id as string)
    if (!row) return notFound('Kiadás')
    const guard = guardTransition(PPE_ISSUANCE_FSM, 'acknowledge', row.status)
    if (guard) return guard
    row.status = 'Acknowledged'
    row.acknowledgedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // FSM: Acknowledged → Returned (terminális)
  http.post(`${ISSUANCES}/:id/return`, ({ params }) => {
    const row = findIssuance(params.id as string)
    if (!row) return notFound('Kiadás')
    const guard = guardTransition(PPE_ISSUANCE_FSM, 'return', row.status)
    if (guard) return guard
    row.status = 'Returned'
    row.returnedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // FSM: Acknowledged → Replaced — új kiadást is létrehoz (201, az ÚJ id-val)
  http.post(`${ISSUANCES}/:id/replace`, async ({ params, request }) => {
    const row = findIssuance(params.id as string)
    if (!row) return notFound('Kiadás')
    const guard = guardTransition(PPE_ISSUANCE_FSM, 'replace', row.status)
    if (guard) return guard
    const body = (await request.json()) as { replacedBy: string; newExpiresAt?: string | null }
    const item = findItem(row.ppeItemId)
    const replacement: PpeIssuanceRecord = {
      issuanceId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      employeeId: row.employeeId,
      ppeItemId: row.ppeItemId,
      issuedAt: new Date().toISOString(),
      issuedBy: body.replacedBy,
      quantity: row.quantity,
      expiresAt: item ? deriveExpiry(item, body.newExpiresAt) : (body.newExpiresAt ?? null),
      status: 'Issued',
    }
    row.status = 'Replaced'
    row.replacedAt = replacement.issuedAt
    row.replacementIssuanceId = replacement.issuanceId
    getEhsDb().ppeIssuances.push(replacement)
    return HttpResponse.json({ id: replacement.issuanceId }, { status: 201 })
  }),
]

import { http, HttpResponse } from 'msw'
import { EHS_API_BASE } from '../../services/ehs/config'
import type { EhsLocation, LocationKind } from '../../services/ehs/locations'
import { TENANT_ID } from './seed'
import { getEhsDb, jsonError, notFound } from './db'

/** Helyszín-törzs handlerek (openapi Locations tag, 5 végpont). */

const BASE = `${EHS_API_BASE}/locations`

interface LocationBody {
  code: string
  name: string
  kind: LocationKind
  parentLocationId?: string | null
}

export const locationHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('activeOnly') === 'true'
    const kind = url.searchParams.get('kind')
    const parent = url.searchParams.get('parentLocationId')

    let rows = getEhsDb().locations
    if (activeOnly) rows = rows.filter((l) => l.isActive)
    if (kind) rows = rows.filter((l) => l.kind === kind)
    if (parent) rows = rows.filter((l) => l.parentLocationId === parent)
    return HttpResponse.json(rows)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const row = getEhsDb().locations.find((l) => l.locationId === params.id)
    return row ? HttpResponse.json(row) : notFound('Helyszín')
  }),

  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as LocationBody
    const db = getEhsDb()
    if (db.locations.some((l) => l.code === body.code)) {
      return jsonError(409, 'Conflict', `A(z) „${body.code}" kód már létezik.`)
    }
    const row: EhsLocation = {
      locationId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      code: body.code,
      name: body.name,
      kind: body.kind,
      parentLocationId: body.parentLocationId ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    db.locations.push(row)
    return HttpResponse.json({ id: row.locationId }, { status: 201 })
  }),

  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as LocationBody
    const row = getEhsDb().locations.find((l) => l.locationId === params.id)
    if (!row) return notFound('Helyszín')
    Object.assign(row, {
      code: body.code, name: body.name, kind: body.kind,
      parentLocationId: body.parentLocationId ?? null,
    })
    return new HttpResponse(null, { status: 204 })
  }),

  // Guard: aktív gyerekkel rendelkező csomópont nem deaktiválható (openapi: 409)
  http.post(`${BASE}/:id/deactivate`, ({ params }) => {
    const db = getEhsDb()
    const row = db.locations.find((l) => l.locationId === params.id)
    if (!row) return notFound('Helyszín')
    const hasActiveChildren = db.locations.some(
      (l) => l.parentLocationId === row.locationId && l.isActive,
    )
    if (hasActiveChildren) {
      return jsonError(409, 'Conflict', 'A helyszín aktív al-helyszínekkel nem deaktiválható.')
    }
    row.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),
]

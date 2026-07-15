import { http, HttpResponse } from 'msw'
import { EHS_API_BASE, EXPIRY_WINDOW_DAYS } from '../../services/ehs/config'
import type { RenewSdsPayload } from '../../services/ehs/materials'
import { computeSdsValidity } from '../../services/ehs/validity'
import { TENANT_ID } from './seed'
import { getEhsDb, jsonError, notFound, toMaterialDto, toMaterialListItem, type MaterialRecord } from './db'

/** Veszélyes anyag / SDS handlerek (openapi HazardousMaterials tag, 7 végpont). */

const BASE = `${EHS_API_BASE}/hazardous-materials`

function findMaterial(id: string) {
  return getEhsDb().materials.find((m) => m.materialId === id)
}

type RegisterBody = Omit<MaterialRecord, 'materialId' | 'tenantId' | 'status' | 'registeredAt'>

export const materialHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const locationId = url.searchParams.get('locationId')
    const validity = url.searchParams.get('validity')

    let rows = getEhsDb().materials
    if (status) rows = rows.filter((m) => m.status === status)
    if (locationId) rows = rows.filter((m) => m.storageLocationId === locationId)
    let items = rows.map(toMaterialListItem)
    if (validity) items = items.filter((m) => m.sdsValidity === validity)
    return HttpResponse.json(items)
  }),

  // Dashboard: aktív anyagok, lejáró SDS-sel az ablakon belül (lejártakkal együtt)
  http.get(`${BASE}/expiring`, ({ request }) => {
    const url = new URL(request.url)
    const withinDays = Number(url.searchParams.get('withinDays') ?? EXPIRY_WINDOW_DAYS)
    const items = getEhsDb().materials
      .filter((m) => m.status === 'Active')
      .filter((m) => computeSdsValidity(m.sdsExpiresAt, new Date(), withinDays) !== 'Valid')
      .sort((a, b) => a.sdsExpiresAt.localeCompare(b.sdsExpiresAt))
      .map(toMaterialListItem)
    return HttpResponse.json(items)
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const row = findMaterial(params.id as string)
    return row ? HttpResponse.json(toMaterialDto(row)) : notFound('Anyag')
  }),

  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as RegisterBody
    const db = getEhsDb()
    const row: MaterialRecord = {
      ...body,
      materialId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      status: 'Active',
      registeredAt: new Date().toISOString(),
    }
    db.materials.push(row)
    return HttpResponse.json({ id: row.materialId }, { status: 201 })
  }),

  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const row = findMaterial(params.id as string)
    if (!row) return notFound('Anyag')
    if (row.status === 'Archived') {
      return jsonError(409, 'Conflict', 'Archivált anyag nem módosítható.')
    }
    const body = (await request.json()) as Partial<RegisterBody>
    // Az SDS-dátumok NEM itt változnak (renew-sds a dedikált út)
    Object.assign(row, {
      name: body.name ?? row.name,
      supplier: body.supplier ?? row.supplier,
      storageLocationId: body.storageLocationId ?? row.storageLocationId,
      quantityOnSite: body.quantityOnSite ?? row.quantityOnSite,
      unit: body.unit ?? row.unit,
      casNumber: body.casNumber !== undefined ? body.casNumber : row.casNumber,
      ghsHazardClasses: body.ghsHazardClasses ?? row.ghsHazardClasses,
    })
    return new HttpResponse(null, { status: 204 })
  }),

  // Új SDS-verzió — a RenewTrainingRecord mintája
  http.post(`${BASE}/:id/renew-sds`, async ({ params, request }) => {
    const row = findMaterial(params.id as string)
    if (!row) return notFound('Anyag')
    if (row.status === 'Archived') {
      return jsonError(409, 'Conflict', 'Archivált anyag SDS-e nem újítható meg.')
    }
    const body = (await request.json()) as RenewSdsPayload
    if (new Date(body.newExpiresAt) <= new Date(body.newIssuedAt)) {
      return jsonError(400, 'BadRequest', 'A lejárat nem lehet a kiállítás előtt.')
    }
    row.sdsIssuedAt = body.newIssuedAt
    row.sdsExpiresAt = body.newExpiresAt
    if (body.newSdsDocumentId !== undefined) row.sdsDocumentId = body.newSdsDocumentId
    return new HttpResponse(null, { status: 204 })
  }),

  // Életciklus: Active → Archived
  http.post(`${BASE}/:id/archive`, ({ params }) => {
    const row = findMaterial(params.id as string)
    if (!row) return notFound('Anyag')
    if (row.status === 'Archived') {
      return jsonError(409, 'Conflict', 'Az anyag már archivált.')
    }
    row.status = 'Archived'
    return new HttpResponse(null, { status: 204 })
  }),
]

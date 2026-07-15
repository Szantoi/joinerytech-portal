import { http, HttpResponse } from 'msw'
import { CONTROLLING_API_BASE } from '../../services/controlling/config'
import { COST_CATEGORIES } from '../../services/controlling/calc'
import type { CostAdjustment, CreateAdjustmentPayload } from '../../services/controlling/adjustments'
import { getControllingDb, jsonError, notFound, type StoredAdjustment } from './db'

/**
 * Költség-korrekció (utókalkuláció) handlerek — a backend CostAdjustment
 * validációinak tükre: kötelező indok, nem-nulla összeg, hatály↔projectId
 * invariáns (400), létező projekt (404), dupla törlés (409), soft-delete (204).
 */

const BASE = `${CONTROLLING_API_BASE}/cost-adjustments`

/** Következő korrekció-azonosító (CADJ-NNN). */
function nextAdjustmentId(adjustments: StoredAdjustment[]): string {
  const max = adjustments.reduce((m, a) => {
    const n = Number(a.id.split('-').pop())
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return `CADJ-${String(max + 1).padStart(3, '0')}`
}

/** A backend CostAdjustment.Create guardjainak tükre — hibaüzenet vagy null. */
function validate(body: CreateAdjustmentPayload): string | null {
  if (!body.reason?.trim()) return 'A korrekció indoka kötelező (audit trail).'
  if (!Number.isFinite(body.amount) || body.amount === 0) return 'A korrekció összege nem lehet nulla.'
  if (!COST_CATEGORIES.includes(body.category)) return 'Ismeretlen költség-kategória.'
  if (body.scope === 'project' && !body.projectId) return 'Projekt-hatályú korrekcióhoz projekt megadása kötelező.'
  if (body.scope === 'portfolio' && body.projectId) return 'Portfólió-hatályú korrekcióhoz nem adható meg projekt.'
  return null
}

/** Válasz-DTO: a store-belső soft-delete jelző nélkül. */
function toDto(a: StoredAdjustment): CostAdjustment {
  return {
    id: a.id, projectId: a.projectId, category: a.category, amount: a.amount,
    scope: a.scope, reason: a.reason, createdBy: a.createdBy, createdAt: a.createdAt,
  }
}

export const adjustmentHandlers = [
  http.get(BASE, ({ request }) => {
    const projectId = new URL(request.url).searchParams.get('projectId')
    let rows = getControllingDb().adjustments.filter((a) => !a.isDeleted)
    if (projectId) rows = rows.filter((a) => a.scope === 'project' && a.projectId === projectId)
    // legfrissebb elöl
    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    return HttpResponse.json(sorted.map(toDto))
  }),

  http.post(BASE, async ({ request }) => {
    const db = getControllingDb()
    const body = (await request.json()) as CreateAdjustmentPayload

    const error = validate(body)
    if (error) return jsonError(400, 'BadRequest', error)
    const projectExists = db.projects.some((p) => p.id === body.projectId)
    if (body.scope === 'project' && !projectExists) return notFound('Projekt')

    const adjustment: StoredAdjustment = {
      id: nextAdjustmentId(db.adjustments),
      projectId: body.scope === 'project' ? body.projectId : null,
      category: body.category,
      amount: body.amount,
      scope: body.scope,
      reason: body.reason.trim(),
      createdBy: body.createdBy,
      createdAt: new Date().toISOString().slice(0, 10),
      isDeleted: false,
    }
    db.adjustments.push(adjustment)

    return HttpResponse.json(toDto(adjustment), { status: 201 })
  }),

  http.delete(`${BASE}/:id`, ({ params }) => {
    const adjustment = getControllingDb().adjustments.find((a) => a.id === params.id)
    if (!adjustment) return notFound('Korrekció')
    if (adjustment.isDeleted) {
      return jsonError(409, 'Conflict', 'A korrekció már törölve van.')
    }
    adjustment.isDeleted = true
    return new HttpResponse(null, { status: 204 })
  }),
]

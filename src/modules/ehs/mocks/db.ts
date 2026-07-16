import { HttpResponse } from 'msw'
import type { EhsLocation } from '../services/locations'
import type { Incident } from '../services/incidents'
import type { Capa } from '../services/capa'
import type { HazardousMaterial, HazardousMaterialListItem } from '../services/materials'
import type { PpeIssuance, PpeItem } from '../services/ppe'
import type { SafetyWalk, SafetyWalkListItem } from '../services/safetyWalks'
import { computeSdsValidity, isPpeIssuanceExpired } from '../services/validity'
import { canTransition, type FsmRule } from '../services/fsm'
import {
  seedCapas, seedIncidents, seedLocations, seedMaterials,
  seedPpeIssuances, seedPpeItems, seedWalks,
} from './seed'

/**
 * EHS mock adatbázis — állapottartó in-memory store az MSW handlerekhez.
 * A SZÁMÍTOTT mezőket (sdsValidity, isExpired, findingCount, incidens CAPA-lista)
 * a szerializálók állítják elő olvasáskor — a backendhez hasonlóan a nyers
 * rekord nem tárolja őket.
 */

// Tárolt rekord-típusok: a DTO számított mezők nélkül
export type MaterialRecord = Omit<HazardousMaterial, 'sdsValidity'>
export type PpeIssuanceRecord = Omit<PpeIssuance, 'isExpired'>
export type WalkRecord = Omit<SafetyWalk, 'findings'> & { findings: SafetyWalk['findings'] }
export type IncidentRecord = Omit<Incident, 'correctiveActions'>

export interface EhsDb {
  locations: EhsLocation[]
  incidents: IncidentRecord[]
  materials: MaterialRecord[]
  ppeItems: PpeItem[]
  ppeIssuances: PpeIssuanceRecord[]
  walks: WalkRecord[]
  capas: Capa[]
}

function createDb(): EhsDb {
  return {
    locations: seedLocations(),
    incidents: seedIncidents(),
    materials: seedMaterials(),
    ppeItems: seedPpeItems(),
    ppeIssuances: seedPpeIssuances(),
    walks: seedWalks(),
    capas: seedCapas(),
  }
}

let db = createDb()

export function getEhsDb(): EhsDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetEhsDb(): void {
  db = createDb()
}

// ── HTTP helperek ───────────────────────────────────────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

/**
 * FSM guard — a backend domain guard tükre: tiltott átmenet → 409 Conflict
 * a szabálysértést leíró üzenettel. Engedélyezettnél null (a handler folytatja).
 */
export function guardTransition<S extends string>(
  fsm: Record<string, FsmRule<S>>,
  action: string,
  status: S,
): Response | null {
  if (canTransition(fsm, action, status)) return null
  return jsonError(
    409,
    'Conflict',
    `Érvénytelen FSM-átmenet: „${status}" állapotból nem hajtható végre a(z) „${action}" művelet.`,
  )
}

// ── Szerializálók (számított mezők) ─────────────────────────────────────────

export function toMaterialDto(record: MaterialRecord): HazardousMaterial {
  return { ...record, sdsValidity: computeSdsValidity(record.sdsExpiresAt) }
}

export function toMaterialListItem(record: MaterialRecord): HazardousMaterialListItem {
  const { materialId, name, supplier, storageLocationId, quantityOnSite, unit, sdsExpiresAt, status } = record
  return {
    materialId, name, supplier, storageLocationId, quantityOnSite, unit, sdsExpiresAt, status,
    sdsValidity: computeSdsValidity(sdsExpiresAt),
  }
}

export function toIssuanceDto(record: PpeIssuanceRecord): PpeIssuance {
  return { ...record, isExpired: isPpeIssuanceExpired(record.expiresAt, record.status) }
}

export function toWalkListItem(record: WalkRecord): SafetyWalkListItem {
  const { safetyWalkId, locationId, scheduledDate, conductedBy, status } = record
  return { safetyWalkId, locationId, scheduledDate, conductedBy, status, findingCount: record.findings.length }
}

/** Az incidens CAPA-listája az egységes CAPA store-ból áll össze (unified CAPA). */
export function toIncidentDto(record: IncidentRecord): Incident {
  const correctiveActions = db.capas
    .filter((c) => c.source === 'Incident' && c.sourceId === record.incidentId)
    .map((c) => ({
      description: c.description,
      responsiblePerson: c.assignedTo,
      dueDate: c.dueDate,
      completedAt: c.completedAt ?? null,
    }))
  return { ...record, correctiveActions }
}

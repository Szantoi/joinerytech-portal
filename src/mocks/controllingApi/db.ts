import { HttpResponse } from 'msw'
import type { ControllingProject } from '../../services/controlling/projects'
import type { AdjustmentInput } from '../../services/controlling/calc'
import type { CostAdjustment } from '../../services/controlling/adjustments'
import { seedAdjustments, seedProjects } from './seed'

/**
 * Kontrolling mock adatbázis — állapottartó in-memory store az MSW
 * handlerekhez (az ehsApi/crmApi db.ts mintája). A backend host-ba kötéséig
 * (audit G3.2) ez A kontraktus (MSW-first): a korrekció-mutációk perzisztálnak
 * a munkameneten belül, és minden számított válasz (EAC/variance/fedezet)
 * a services/controlling/calc.ts-szel — a backend számítás-tükrével — készül.
 */

/** Tárolt korrekció: soft-delete jelzővel (a backend IsDeleted tükre). */
export interface StoredAdjustment extends CostAdjustment {
  isDeleted: boolean
}

export interface ControllingDb {
  projects: ControllingProject[]
  adjustments: StoredAdjustment[]
}

function createDb(): ControllingDb {
  return {
    projects: seedProjects(),
    adjustments: seedAdjustments(),
  }
}

let db = createDb()

export function getControllingDb(): ControllingDb {
  return db
}

/** Teszt-izoláció: minden teszt friss seed-állapotból indul. */
export function resetControllingDb(): void {
  db = createDb()
}

/** Egy projekt élő (nem törölt), projekt-hatályú korrekciói calc-bemenetként. */
export function projectAdjustments(projectId: string): AdjustmentInput[] {
  return db.adjustments.filter(
    (a) => !a.isDeleted && a.scope === 'project' && a.projectId === projectId,
  )
}

/** Élő portfólió-hatályú korrekciók — a portfólió-összesenben EGYSZER számítanak. */
export function portfolioAdjustments(): AdjustmentInput[] {
  return db.adjustments.filter((a) => !a.isDeleted && a.scope === 'portfolio')
}

// ── HTTP helperek (az ehsApi/crmApi mintája) ────────────────────────────────

export function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status })
}

export function notFound(what: string) {
  return jsonError(404, 'NotFound', `${what} nem található`)
}

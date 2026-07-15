import { http, HttpResponse } from 'msw'
import { CONTROLLING_API_BASE } from '../../services/controlling/config'
import { calcProjectCosts } from '../../services/controlling/calc'
import type { ControllingProject, ProjectStatus, ProjectSummary } from '../../services/controlling/projects'
import { getControllingDb, notFound, projectAdjustments } from './db'

/**
 * Projekt handlerek — lista (számított összegzéssel), részlet,
 * költség-kalkuláció. Minden számítás a services/controlling/calc.ts-szel
 * (a backend ProjectCostCalculation tükre) készül, a projekt-hatályú élő
 * korrekciókkal együtt.
 */

const BASE = `${CONTROLLING_API_BASE}/projects`

function findProject(id: string | readonly string[]) {
  return getControllingDb().projects.find((p) => p.id === id)
}

/** Portfólió-sor: törzsadat + számított összegzés (a lista nem küld sorokat). */
export function toSummary(p: ControllingProject): ProjectSummary {
  const { lines, ...base } = p
  const costs = calcProjectCosts(p.contractValue, lines, projectAdjustments(p.id))
  return { ...base, ...costs }
}

export const projectHandlers = [
  http.get(BASE, ({ request }) => {
    const status = new URL(request.url).searchParams.get('status') as ProjectStatus | null
    let rows = getControllingDb().projects
    if (status) rows = rows.filter((p) => p.status === status)
    // legfrissebb (legnagyobb azonosítójú) elöl
    const sorted = [...rows].sort((a, b) => b.id.localeCompare(a.id))
    return HttpResponse.json(sorted.map(toSummary))
  }),

  http.get(`${BASE}/:id`, ({ params }) => {
    const project = findProject(params.id as string)
    return project ? HttpResponse.json(project) : notFound('Projekt')
  }),

  http.get(`${BASE}/:id/cost-calculation`, ({ params }) => {
    const project = findProject(params.id as string)
    if (!project) return notFound('Projekt')
    const costs = calcProjectCosts(
      project.contractValue,
      project.lines,
      projectAdjustments(project.id),
    )
    return HttpResponse.json({
      projectId: project.id,
      ...costs,
      calculatedAt: new Date().toISOString(),
    })
  }),
]

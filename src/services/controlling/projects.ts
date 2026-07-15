import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { CONTROLLING_API_BASE } from './config'
import { controllingKeys } from './keys'
import { COST_CATEGORIES } from './calc'

/**
 * Projektek — portfólió-lista (számított összegzéssel), részlet és
 * költség-kalkuláció (EAC/variance/fedezet, a backend cost-calculation
 * végpontjának tükre). A projekt-státusz ÉLETCIKLUS-CÍMKE, nem szigorú FSM
 * (terv 70. sor) — nincs átmenet-végpont, a címke a projekt-törzsből jön.
 */

// ── Sémák (MSW-first kontraktus — ld. src/mocks/controllingApi) ─────────────

export const projectStatusSchema = z.enum(['draft', 'active', 'install', 'done', 'on_hold'])
export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const costCategorySchema = z.enum(COST_CATEGORIES)

export const costLineSchema = z.object({
  category: costCategorySchema,
  label: z.string(),
  plan: z.number(),
  actual: z.number(),
  note: z.string().optional(),
})
export type CostLine = z.infer<typeof costLineSchema>

/** Kategória-költségkép (backend CategoryCostDto tükre). */
export const categoryCostSchema = z.object({
  category: costCategorySchema,
  plan: z.number(),
  actual: z.number(),
  projected: z.number(),
  variance: z.number(),
})

const projectBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  customer: z.string(),
  status: projectStatusSchema,
  contractValue: z.number(),
  invoiced: z.number(),
})

/** Projekt-részlet: törzsadat + költségsorok. */
export const projectSchema = projectBaseSchema.extend({
  lines: z.array(costLineSchema),
})
export type ControllingProject = z.infer<typeof projectSchema>

/** Portfólió-sor: törzsadat + SZÁMÍTOTT összegzés (korrekciókkal együtt). */
export const projectSummarySchema = projectBaseSchema.extend({
  byCategory: z.array(categoryCostSchema),
  planTotal: z.number(),
  actualTotal: z.number(),
  eacTotal: z.number(),
  variance: z.number(),
  variancePct: z.number().nullable(),
  planMarginPct: z.number().nullable(),
  actualMarginPct: z.number().nullable(),
  eacMarginPct: z.number().nullable(),
})
export type ProjectSummary = z.infer<typeof projectSummarySchema>

/** Költség-kalkuláció (backend EACCalculationDto + margók tükre). */
export const projectCalcSchema = z.object({
  projectId: z.string(),
  byCategory: z.array(categoryCostSchema),
  planTotal: z.number(),
  actualTotal: z.number(),
  eacTotal: z.number(),
  variance: z.number(),
  variancePct: z.number().nullable(),
  planMarginPct: z.number().nullable(),
  actualMarginPct: z.number().nullable(),
  eacMarginPct: z.number().nullable(),
  calculatedAt: z.string(),
})
export type ProjectCalc = z.infer<typeof projectCalcSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type ProjectFilters = {
  status?: ProjectStatus
}

export function fetchProjects(filters: ProjectFilters = {}): Promise<ProjectSummary[]> {
  return apiFetch(`${CONTROLLING_API_BASE}/projects`, {
    query: filters,
    schema: z.array(projectSummarySchema),
  })
}

export function fetchProject(id: string): Promise<ControllingProject> {
  return apiFetch(`${CONTROLLING_API_BASE}/projects/${id}`, { schema: projectSchema })
}

export function fetchProjectCalc(id: string): Promise<ProjectCalc> {
  return apiFetch(`${CONTROLLING_API_BASE}/projects/${id}/cost-calculation`, {
    schema: projectCalcSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: controllingKeys.projects(filters),
    queryFn: () => fetchProjects(filters),
  })
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: controllingKeys.project(id ?? ''),
    queryFn: () => fetchProject(id!),
    enabled: id !== null,
  })
}

export function useProjectCalc(id: string | null) {
  return useQuery({
    queryKey: controllingKeys.projectCalc(id ?? ''),
    queryFn: () => fetchProjectCalc(id!),
    enabled: id !== null,
  })
}

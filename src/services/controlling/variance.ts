import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { CONTROLLING_API_BASE } from './config'
import { controllingKeys } from './keys'
import { costCategorySchema } from './projects'

/**
 * Eltérés-elemzés — portfólió-szintű terv vs. tény bontás kategóriánként,
 * projektenkénti drill-down sorokkal (a backend VarianceAnalysisDto
 * portfólióra általánosított tükre; a projekt-hatályú korrekciók a tényben).
 */

export const varianceProjectRowSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  plan: z.number(),
  actual: z.number(),
  variance: z.number(),
})
export type VarianceProjectRow = z.infer<typeof varianceProjectRowSchema>

export const varianceRowSchema = z.object({
  category: costCategorySchema,
  plan: z.number(),
  actual: z.number(),
  variance: z.number(),
  variancePct: z.number().nullable(),
  /** Drill-down: az adott kategória projektenkénti bontása. */
  projects: z.array(varianceProjectRowSchema),
})
export type VarianceRow = z.infer<typeof varianceRowSchema>

export function fetchVariance(): Promise<VarianceRow[]> {
  return apiFetch(`${CONTROLLING_API_BASE}/variance`, {
    schema: z.array(varianceRowSchema),
  })
}

export function useVariance() {
  return useQuery({
    queryKey: controllingKeys.variance(),
    queryFn: fetchVariance,
  })
}

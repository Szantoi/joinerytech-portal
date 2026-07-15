import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { CONTROLLING_API_BASE } from './config'
import { controllingKeys } from './keys'

/**
 * Portfólió-összegzés — a vezetői áttekintés adatforrása (a backend
 * PortfolioSummaryDto tükre, a UI KPI-jaihoz igazított mezőkkel).
 * A portfólió-hatályú korrekciók itt EGYSZER számítanak bele a tény/EAC
 * összesenbe (projektenként nem — ld. mocks/controllingApi/handlers.portfolio).
 */

export const marginTrendPointSchema = z.object({
  /** Hónap (YYYY-MM). */
  month: z.string(),
  planMarginPct: z.number(),
  actualMarginPct: z.number(),
})
export type MarginTrendPoint = z.infer<typeof marginTrendPointSchema>

export const atRiskProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  eacMarginPct: z.number().nullable(),
})
export type AtRiskProject = z.infer<typeof atRiskProjectSchema>

export const portfolioSummarySchema = z.object({
  projectCount: z.number(),
  contractTotal: z.number(),
  invoicedTotal: z.number(),
  planCostTotal: z.number(),
  actualCostTotal: z.number(),
  eacTotal: z.number(),
  planMarginPct: z.number().nullable(),
  actualMarginPct: z.number().nullable(),
  eacMarginPct: z.number().nullable(),
  /** Futó projektek, ahol az EAC-fedezet a kockázati küszöb alatt van. */
  projectsAtRisk: z.number(),
  atRiskProjects: z.array(atRiskProjectSchema),
  /** Projektek, ahol az EAC meghaladja a tervköltséget. */
  eacOverrunCount: z.number(),
  /** A terv feletti EAC-többlet összege (Σ pozitív EAC−terv). */
  eacOverrunTotal: z.number(),
  marginTrend: z.array(marginTrendPointSchema),
})
export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>

export function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  return apiFetch(`${CONTROLLING_API_BASE}/portfolio/cost-calculation`, {
    schema: portfolioSummarySchema,
  })
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: controllingKeys.portfolio(),
    queryFn: fetchPortfolioSummary,
  })
}

import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { CRM_API_BASE, RECENT_ACTIVITY_LIMIT } from './config'
import { crmKeys } from './keys'

/**
 * Tevékenységnapló — a lead/lehetőség beágyazott activity-listáinak közös
 * sémája + a kereszt-entitás „legutóbbi tevékenységek" lekérdezés (áttekintés).
 * Bejegyzés-rögzítés a szülő-entitás végpontján megy (leads.ts / opportunities.ts).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const activityKindSchema = z.enum(['hivas', 'email', 'talalkozo', 'megjegyzes'])
export type ActivityKind = z.infer<typeof activityKindSchema>

export const crmActivitySchema = z.object({
  /** Időbélyeg (a mock a meglévő "YYYY-MM-DD HH:mm" formátumot használja). */
  at: z.string(),
  kind: activityKindSchema,
  who: z.string(),
  text: z.string(),
})
export type CrmActivity = z.infer<typeof crmActivitySchema>

/** Új bejegyzés payloadja (POST {parent}/:id/activities). */
export interface AddActivityPayload {
  kind: ActivityKind
  who: string
  text: string
}

/** Kereszt-entitás nézet: melyik lead/lehetőséghez tartozik a bejegyzés. */
export const recentActivitySchema = crmActivitySchema.extend({
  refType: z.enum(['lead', 'opp']),
  refId: z.string(),
  refTitle: z.string(),
})
export type RecentActivity = z.infer<typeof recentActivitySchema>

// ── Fetcher + hook ──────────────────────────────────────────────────────────

export function fetchRecentActivities(limit = RECENT_ACTIVITY_LIMIT): Promise<RecentActivity[]> {
  return apiFetch(`${CRM_API_BASE}/activities/recent`, {
    query: { limit },
    schema: z.array(recentActivitySchema),
  })
}

export function useRecentActivities(limit = RECENT_ACTIVITY_LIMIT) {
  return useQuery({
    queryKey: crmKeys.recentActivities(limit),
    queryFn: () => fetchRecentActivities(limit),
  })
}

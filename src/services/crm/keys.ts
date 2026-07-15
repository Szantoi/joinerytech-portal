import type { QueryParams } from '../apiClient'

/**
 * TanStack Query kulcs-gyár a CRM modulhoz.
 * Hierarchikus: `crmKeys.all`-lal a teljes modul-cache invalidálható,
 * domain-kulccsal (pl. `crmKeys.leads()`) egy-egy erőforrás-család.
 */
export const crmKeys = {
  all: ['crm'] as const,

  leads: (filters?: QueryParams) => [...crmKeys.all, 'leads', filters ?? {}] as const,
  lead: (id: string) => [...crmKeys.all, 'lead', id] as const,

  opps: (filters?: QueryParams) => [...crmKeys.all, 'opps', filters ?? {}] as const,
  opp: (id: string) => [...crmKeys.all, 'opp', id] as const,

  tasks: (filters?: QueryParams) => [...crmKeys.all, 'tasks', filters ?? {}] as const,

  recentActivities: (limit: number) => [...crmKeys.all, 'activities-recent', limit] as const,
} as const

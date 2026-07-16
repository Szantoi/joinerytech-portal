import type { QueryParams } from '../../../services/apiClient'

/**
 * TanStack Query kulcs-gyár az EHS modulhoz.
 * Hierarchikus: `ehsKeys.all`-lal a teljes modul-cache invalidálható,
 * domain-kulccsal (pl. `ehsKeys.incidents()`) egy-egy erőforrás-család.
 */
export const ehsKeys = {
  all: ['ehs'] as const,

  locations: (filters?: QueryParams) => [...ehsKeys.all, 'locations', filters ?? {}] as const,

  incidents: (filters?: QueryParams) => [...ehsKeys.all, 'incidents', filters ?? {}] as const,
  incident: (id: string) => [...ehsKeys.all, 'incident', id] as const,

  materials: (filters?: QueryParams) => [...ehsKeys.all, 'materials', filters ?? {}] as const,
  material: (id: string) => [...ehsKeys.all, 'material', id] as const,
  expiringSds: (withinDays: number) => [...ehsKeys.all, 'materials-expiring', withinDays] as const,

  ppeItems: (filters?: QueryParams) => [...ehsKeys.all, 'ppe-items', filters ?? {}] as const,
  ppeIssuances: (filters?: QueryParams) => [...ehsKeys.all, 'ppe-issuances', filters ?? {}] as const,
  expiringPpe: (withinDays: number) => [...ehsKeys.all, 'ppe-expiring', withinDays] as const,

  walks: (filters?: QueryParams) => [...ehsKeys.all, 'walks', filters ?? {}] as const,
  walk: (id: string) => [...ehsKeys.all, 'walk', id] as const,

  capas: (filters?: QueryParams) => [...ehsKeys.all, 'capas', filters ?? {}] as const,
} as const

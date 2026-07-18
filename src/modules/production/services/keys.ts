import type { QueryParams } from '../../../services/apiClient'

/**
 * TanStack Query kulcs-gyár a Production modulhoz (qaKeys/ehsKeys minta).
 * Hierarchikus: `productionKeys.all`-lal a teljes modul-cache invalidálható.
 * FIGYELEM: a detail kulcsok ('plan', 'execution', 'order' — egyes szám) NEM
 * a lista-prefix alatt élnek — mutáció után KÜLÖN invalidálandók (EHS README
 * 6. szabály). A kereszt-entitás invalidálás (terv-freeze → execution + offcut)
 * a mutáció-hookokban él (plans.ts).
 */
export const productionKeys = {
  all: ['production'] as const,

  plans: () => [...productionKeys.all, 'plans'] as const,
  plan: (id: string) => [...productionKeys.all, 'plan', id] as const,
  priorityProfiles: () => [...productionKeys.all, 'priorityProfiles'] as const,

  executions: () => [...productionKeys.all, 'executions'] as const,
  execution: (id: string) => [...productionKeys.all, 'execution', id] as const,
  executionProgress: (id: string) => [...productionKeys.all, 'executionProgress', id] as const,
  executionMilestones: (id: string) => [...productionKeys.all, 'executionMilestones', id] as const,

  orders: (filters?: QueryParams) => [...productionKeys.all, 'orders', filters ?? {}] as const,
  order: (id: string) => [...productionKeys.all, 'order', id] as const,
  orderCuttingList: (id: string) => [...productionKeys.all, 'orderCuttingList', id] as const,

  quotes: (filters?: QueryParams) => [...productionKeys.all, 'quotes', filters ?? {}] as const,

  waste: (filters?: QueryParams) => [...productionKeys.all, 'waste', filters ?? {}] as const,
} as const

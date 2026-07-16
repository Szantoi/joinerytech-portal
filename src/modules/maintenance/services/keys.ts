import type { QueryParams } from '../../../services/apiClient'

/**
 * TanStack Query kulcs-gyár a Maintenance modulhoz (a hrKeys/crmKeys mintája).
 * Hierarchikus: `maintenanceKeys.all`-lal a teljes modul-cache invalidálható.
 * FIGYELEM: a detail kulcsok ('asset', 'workorder' — egyes szám) NEM a
 * lista-prefix alatt élnek — mutáció után KÜLÖN invalidálandók
 * (EHS README 6. szabály, CRM S2 review-lecke).
 */
export const maintenanceKeys = {
  all: ['maintenance'] as const,

  assets: (filters?: QueryParams) => [...maintenanceKeys.all, 'assets', filters ?? {}] as const,
  asset: (id: string) => [...maintenanceKeys.all, 'asset', id] as const,

  workOrders: (filters?: QueryParams) =>
    [...maintenanceKeys.all, 'workorders', filters ?? {}] as const,
  workOrder: (id: string) => [...maintenanceKeys.all, 'workorder', id] as const,
} as const

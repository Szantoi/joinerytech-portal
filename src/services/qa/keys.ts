import type { QueryParams } from '../apiClient'

/**
 * TanStack Query kulcs-gyár a QA modulhoz (a maintenanceKeys/hrKeys mintája).
 * Hierarchikus: `qaKeys.all`-lal a teljes modul-cache invalidálható.
 * FIGYELEM: a detail kulcsok ('inspection', 'ticket' — egyes szám) NEM a
 * lista-prefix alatt élnek — mutáció után KÜLÖN invalidálandók
 * (EHS README 6. szabály, CRM S2 review-lecke).
 */
export const qaKeys = {
  all: ['qa'] as const,

  inspections: (filters?: QueryParams) => [...qaKeys.all, 'inspections', filters ?? {}] as const,
  inspection: (id: string) => [...qaKeys.all, 'inspection', id] as const,

  tickets: (filters?: QueryParams) => [...qaKeys.all, 'tickets', filters ?? {}] as const,
  ticket: (id: string) => [...qaKeys.all, 'ticket', id] as const,
} as const

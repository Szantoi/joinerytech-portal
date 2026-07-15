import type { QueryParams } from '../apiClient'

/**
 * TanStack Query kulcs-gyár a DMS modulhoz (a qaKeys/maintenanceKeys mintája).
 * Hierarchikus: `dmsKeys.all`-lal a teljes modul-cache invalidálható.
 * FIGYELEM: a detail kulcs ('document' — egyes szám) NEM a lista-prefix
 * ('documents') alatt él — mutáció után KÜLÖN invalidálandó
 * (EHS README 6. szabály, CRM S2 review-lecke).
 */
export const dmsKeys = {
  all: ['dms'] as const,

  documents: (filters?: QueryParams) => [...dmsKeys.all, 'documents', filters ?? {}] as const,
  document: (id: string) => [...dmsKeys.all, 'document', id] as const,
} as const

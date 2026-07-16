import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { EHS_API_BASE } from './config'
import { ehsKeys } from './keys'

/**
 * EhsLocation — hierarchikus helyszín-törzs (openapi Locations tag).
 * A lapos listából a kliens épít fát a parentLocationId alapján; a
 * baleset-bejelentő wizard helyszín-legördülője is innen töltődik.
 */

export const locationKindSchema = z.enum(['Site', 'Building', 'Hall', 'Zone', 'Outdoor'])
export type LocationKind = z.infer<typeof locationKindSchema>

export const ehsLocationSchema = z.object({
  locationId: z.string(),
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  parentLocationId: z.string().nullable().optional(),
  kind: locationKindSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
})
export type EhsLocation = z.infer<typeof ehsLocationSchema>

export type LocationFilters = {
  activeOnly?: boolean
  kind?: LocationKind
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchLocations(filters: LocationFilters = {}): Promise<EhsLocation[]> {
  return apiFetch(`${EHS_API_BASE}/locations`, {
    query: filters,
    schema: z.array(ehsLocationSchema),
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useEhsLocations(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.locations(filters),
    queryFn: () => fetchLocations(filters),
    staleTime: 5 * 60 * 1000, // törzsadat — ritkán változik
  })
}

/** Helyszín-azonosító → megjelenítendő név térkép (táblázat-cellákhoz). */
export function locationNameMap(locations: EhsLocation[] | undefined): Map<string, string> {
  return new Map((locations ?? []).map((l) => [l.locationId, l.name]))
}

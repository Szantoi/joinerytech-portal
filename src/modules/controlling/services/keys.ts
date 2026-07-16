import type { QueryParams } from '../../../services/apiClient'

/**
 * TanStack Query kulcs-gyár a Kontrolling modulhoz.
 * Hierarchikus: `controllingKeys.all`-lal a teljes modul-cache invalidálható.
 *
 * FONTOS (README 6. szabály): a Kontrolling MINDEN olvasata számított
 * (EAC/variance/fedezet a költségsorokból + korrekciókból) — egy
 * költség-korrekció (utókalkuláció) mutáció ezért a TELJES modul-prefixet
 * invalidálja (`controllingKeys.all`), a detail-kulcsokat is beleértve.
 */
export const controllingKeys = {
  all: ['controlling'] as const,

  projects: (filters?: QueryParams) => [...controllingKeys.all, 'projects', filters ?? {}] as const,
  project: (id: string) => [...controllingKeys.all, 'project', id] as const,
  projectCalc: (id: string) => [...controllingKeys.all, 'project-calc', id] as const,

  portfolio: () => [...controllingKeys.all, 'portfolio'] as const,
  variance: () => [...controllingKeys.all, 'variance'] as const,

  adjustments: (filters?: QueryParams) => [...controllingKeys.all, 'adjustments', filters ?? {}] as const,
} as const

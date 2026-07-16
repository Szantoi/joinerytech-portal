import type { QueryParams } from '../../../services/apiClient'

/**
 * TanStack Query kulcs-gyár a HR modulhoz (a crmKeys mintája).
 * Hierarchikus: `hrKeys.all`-lal a teljes modul-cache invalidálható.
 * FIGYELEM: a detail kulcsok ('employee', 'absence' — egyes szám) NEM a
 * lista-prefix alatt élnek — mutáció után KÜLÖN invalidálandók
 * (EHS README 6. szabály, CRM S2 review-lecke).
 */
export const hrKeys = {
  all: ['hr'] as const,

  employees: (filters?: QueryParams) => [...hrKeys.all, 'employees', filters ?? {}] as const,
  employee: (id: string) => [...hrKeys.all, 'employee', id] as const,

  absences: (filters?: QueryParams) => [...hrKeys.all, 'absences', filters ?? {}] as const,
  absence: (id: string) => [...hrKeys.all, 'absence', id] as const,

  assignments: (filters?: QueryParams) => [...hrKeys.all, 'assignments', filters ?? {}] as const,

  /** Számított heti kapacitás-rács — a távollét-mutációk EZT is invalidálják. */
  capacity: (week: string) => [...hrKeys.all, 'capacity', week] as const,

  timeLogs: (filters?: QueryParams) => [...hrKeys.all, 'timelogs', filters ?? {}] as const,
} as const

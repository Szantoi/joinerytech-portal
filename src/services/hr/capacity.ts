import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../apiClient'
import { HR_API_BASE } from './config'
import { hrKeys } from './keys'
import type { DayLoad, EmployeeWeekCapacity } from './calc'

/**
 * Heti kapacitás-rács — SZÁMÍTOTT erőforrás (backend
 * CapacityCalculationService tükre; a számítás maga a ./calc.ts-ben él,
 * amit az MSW mock is futtat). A kliens sosem számol saját rácsot: a
 * /capacity választ jeleníti meg — a távollét-mutációk invalidálják
 * (hrKeys.capacity, ld. absences.ts).
 */

export const dayLoadSchema: z.ZodType<DayLoad> = z.object({
  day: z.string(),
  workday: z.boolean(),
  capacity: z.number(),
  assigned: z.number(),
  free: z.number(),
  overloaded: z.boolean(),
  absence: z.object({ id: z.string(), type: z.string() }).nullable(),
})

export const employeeWeekCapacitySchema: z.ZodType<EmployeeWeekCapacity> = z.object({
  empId: z.string(),
  days: z.array(dayLoadSchema),
  capacity: z.number(),
  assigned: z.number(),
  utilization: z.number(),
})

export const weekCapacitySchema = z.object({
  /** A hét hétfője (a kérés `week` paramétere, visszaigazolva). */
  week: z.string(),
  /** Az 5 munkanap dátum-kulcsa (H–P). */
  days: z.array(z.string()),
  rows: z.array(employeeWeekCapacitySchema),
})
export type WeekCapacity = z.infer<typeof weekCapacitySchema>

export function fetchWeekCapacity(week: string): Promise<WeekCapacity> {
  return apiFetch(`${HR_API_BASE}/capacity`, { query: { week }, schema: weekCapacitySchema })
}

export function useWeekCapacity(week: string) {
  return useQuery({
    queryKey: hrKeys.capacity(week),
    queryFn: () => fetchWeekCapacity(week),
  })
}

import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { HR_API_BASE } from './config'
import { hrKeys } from './keys'

/**
 * Dolgozók — lista + részlet (read-only törzsadat; a mutációk a távollét- és
 * időnapló-domainben élnek). Sémák a backend Employee aggregátum tükrei
 * (src/hr Domain: Department/SkillKey/SkillLevel/EmploymentType enumok).
 */

// ── Sémák (MSW-first kontraktus — ld. src/mocks/hrApi) ──────────────────────

export const hrDeptSchema = z.enum([
  'gyartas', 'szereles', 'logisztika', 'tervezes', 'ertekesites', 'iroda',
])
export type HrDept = z.infer<typeof hrDeptSchema>

export const payGradeSchema = z.enum(['seged', 'szakmunkas', 'mester', 'mernok', 'vezeto'])
export type PayGrade = z.infer<typeof payGradeSchema>

export const skillKeySchema = z.enum([
  'szabas', 'elzaras', 'cnc', 'osszeszereles', 'felulet',
  'szerel', 'szallit', 'felmer', 'tervezes', 'ertekesites',
])
export type SkillKey = z.infer<typeof skillKeySchema>

/** Készség-szint: 1=alap, 2=rutin, 3=mester (backend SkillLevel tükör). */
export const skillLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type SkillLevel = z.infer<typeof skillLevelSchema>

export const employeeSkillSchema = z.object({
  key: skillKeySchema,
  level: skillLevelSchema,
})
export type EmployeeSkill = z.infer<typeof employeeSkillSchema>

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  dept: hrDeptSchema,
  /** Bérsáv (kategória) + a sávhoz tartozó órabér (Ft/ó). */
  payGrade: payGradeSchema,
  hourlyRate: z.number(),
  weeklyHours: z.number(),
  employment: z.enum(['full', 'part']),
  phone: z.string(),
  email: z.string(),
  startedAt: z.string(),
  active: z.boolean(),
  /** Avatár-szín (a dolgozó vizuális azonosítója a rácsokon). */
  color: z.string(),
  skills: z.array(employeeSkillSchema),
})
export type Employee = z.infer<typeof employeeSchema>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export type EmployeeFilters = {
  dept?: HrDept
  /** Szabad szavas keresés (név / szerep). */
  q?: string
  /** Csak az adott készséggel rendelkezők (készség-mátrix szűrő). */
  skill?: SkillKey
}

export function fetchEmployees(filters: EmployeeFilters = {}): Promise<Employee[]> {
  return apiFetch(`${HR_API_BASE}/employees`, { query: filters, schema: z.array(employeeSchema) })
}

export function fetchEmployee(id: string): Promise<Employee> {
  return apiFetch(`${HR_API_BASE}/employees/${id}`, { schema: employeeSchema })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: hrKeys.employees(filters),
    queryFn: () => fetchEmployees(filters),
  })
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: hrKeys.employee(id ?? ''),
    queryFn: () => fetchEmployee(id!),
    enabled: id !== null,
  })
}

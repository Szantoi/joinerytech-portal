import { z } from 'zod'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/ui'
import { apiFetch } from '../../../services/apiClient'
import { EHS_API_BASE } from './config'
import { ehsKeys } from './keys'
import type { RiskAction, RiskStatus } from './fsm'

/**
 * Kockázatértékelés — a RISKS-5X5-BE magyar ADR-059 wire-kontraktusa.
 * A production kliens a szerver `riskLevel` mezőjét jeleníti meg; a
 * config-vezérelt sávhatárokat nem számolja újra.
 */

export const RISK_SEVERITIES = [
  'elhanyagolhato', 'enyhe', 'kozepes', 'sulyos', 'katasztrofalis',
] as const
export const riskSeveritySchema = z.enum(RISK_SEVERITIES)
export type RiskSeverity = z.infer<typeof riskSeveritySchema>

export const RISK_LIKELIHOODS = [
  'ritka', 'valoszinutlen', 'lehetseges', 'valoszinu', 'szinte_biztos',
] as const
export const riskLikelihoodSchema = z.enum(RISK_LIKELIHOODS)
export type RiskLikelihood = z.infer<typeof riskLikelihoodSchema>

export const RISK_LEVELS = ['alacsony', 'kozepes', 'magas', 'kritikus'] as const
export const riskLevelSchema = z.enum(RISK_LEVELS)
export type RiskLevel = z.infer<typeof riskLevelSchema>

export const RISK_STATUSES = ['piszkozat', 'ellenorzes', 'jovahagyva', 'archivalt'] as const
export const riskStatusSchema = z.enum(RISK_STATUSES)

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

/** .NET Guid input/output contract: syntactically valid, non-empty identifier. */
export const riskGuidSchema = z.string().uuid()
  .refine((value) => value.toLowerCase() !== EMPTY_GUID, 'Az azonosító nem lehet üres GUID.')

/** OpenAPI `date-time` / RFC 3339 value, including an explicit UTC offset. */
export const riskDateTimeSchema = z.string().datetime({ offset: true })

export const riskControlSchema = z.object({
  riskControlId: riskGuidSchema,
  controlMeasure: z.string(),
  responsiblePerson: z.string(),
  implementedAt: riskDateTimeSchema,
  verifiedAt: riskDateTimeSchema.nullable().optional(),
  isVerified: z.boolean(),
  correctiveActionId: riskGuidSchema.nullable().optional(),
})
export type RiskControl = z.infer<typeof riskControlSchema>

export const riskAssessmentListItemSchema = z.object({
  riskAssessmentId: riskGuidSchema,
  hazardDescription: z.string(),
  locationId: riskGuidSchema.nullable().optional(),
  severity: riskSeveritySchema,
  likelihood: riskLikelihoodSchema,
  riskScore: z.number().int().min(1).max(25),
  riskLevel: riskLevelSchema,
  status: riskStatusSchema,
  assessedAt: riskDateTimeSchema,
  reviewDueDate: riskDateTimeSchema,
})
export type RiskAssessmentListItem = z.infer<typeof riskAssessmentListItemSchema>

export const riskAssessmentSchema = riskAssessmentListItemSchema.extend({
  tenantId: riskGuidSchema,
  assessedBy: riskGuidSchema,
  submittedAt: riskDateTimeSchema.nullable().optional(),
  approvedAt: riskDateTimeSchema.nullable().optional(),
  archivedAt: riskDateTimeSchema.nullable().optional(),
  controlMeasures: z.array(riskControlSchema),
})
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>

export const riskMatrixCellSchema = z.object({
  severity: riskSeveritySchema,
  likelihood: riskLikelihoodSchema,
  count: z.number().int().nonnegative(),
  riskLevel: riskLevelSchema,
})
export type RiskMatrixCell = z.infer<typeof riskMatrixCellSchema>

export const riskMatrixSummarySchema = z.object({
  totalAssessments: z.number().int().nonnegative(),
  byRiskLevel: z.partialRecord(riskLevelSchema, z.number().int().nonnegative()),
  byStatus: z.partialRecord(riskStatusSchema, z.number().int().nonnegative()),
  matrixCells: z.array(riskMatrixCellSchema),
}).superRefine((summary, ctx) => {
  const keys = new Set(
    summary.matrixCells.map((cell) => `${cell.severity}:${cell.likelihood}`),
  )

  if (summary.matrixCells.length !== 25 || keys.size !== 25) {
    ctx.addIssue({
      code: 'custom',
      path: ['matrixCells'],
      message: 'A kockázati mátrixnak pontosan 25 egyedi cellát kell tartalmaznia.',
    })
  }

  for (const severity of RISK_SEVERITIES) {
    for (const likelihood of RISK_LIKELIHOODS) {
      if (!keys.has(`${severity}:${likelihood}`)) {
        ctx.addIssue({
          code: 'custom',
          path: ['matrixCells'],
          message: `Hiányzó mátrixcella: ${severity}:${likelihood}.`,
        })
      }
    }
  }

  const matrixCount = summary.matrixCells.reduce((sum, cell) => sum + cell.count, 0)
  if (matrixCount !== summary.totalAssessments) {
    ctx.addIssue({
      code: 'custom',
      path: ['totalAssessments'],
      message: 'A mátrix cellaösszege nem egyezik a teljes elemszámmal.',
    })
  }

  const riskLevelCount = Object.values(summary.byRiskLevel)
    .reduce<number>((sum, count) => sum + count, 0)
  if (riskLevelCount !== summary.totalAssessments) {
    ctx.addIssue({
      code: 'custom',
      path: ['byRiskLevel'],
      message: 'A kockázati szint szerinti bontás nem egyezik a teljes elemszámmal.',
    })
  }

  for (const riskLevel of RISK_LEVELS) {
    const matrixLevelCount = summary.matrixCells
      .filter((cell) => cell.riskLevel === riskLevel)
      .reduce((sum, cell) => sum + cell.count, 0)
    if ((summary.byRiskLevel[riskLevel] ?? 0) !== matrixLevelCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['byRiskLevel', riskLevel],
        message: `A(z) ${riskLevel} bontás nem egyezik a mátrix celláival.`,
      })
    }
  }

  const statusCount = Object.values(summary.byStatus)
    .reduce<number>((sum, count) => sum + count, 0)
  if (statusCount !== summary.totalAssessments) {
    ctx.addIssue({
      code: 'custom',
      path: ['byStatus'],
      message: 'A státusz szerinti bontás nem egyezik a teljes elemszámmal.',
    })
  }

  if ((summary.byStatus.archivalt ?? 0) > 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['byStatus', 'archivalt'],
      message: 'Az élő kockázati mátrix nem tartalmazhat archivált értékelést.',
    })
  }
})
export type RiskMatrixSummary = z.infer<typeof riskMatrixSummarySchema>

export interface RiskFilters {
  riskLevel?: RiskLevel
  status?: RiskStatus
  locationId?: string
  reviewDueBefore?: string
}

export interface CreateRiskAssessmentPayload {
  hazardDescription: string
  severity: RiskSeverity
  likelihood: RiskLikelihood
  assessedBy: string
  reviewDueDate: string
  locationId?: string | null
}

export type UpdateRiskAssessmentPayload = Omit<CreateRiskAssessmentPayload, 'assessedBy'>

export interface AddRiskControlPayload {
  controlMeasure: string
  responsiblePerson: string
  capaDescription?: string | null
  capaAssignedTo?: string | null
  capaDueDate?: string | null
}

export const createRiskAssessmentResultSchema = z.object({ riskAssessmentId: riskGuidSchema })
export type CreateRiskAssessmentResult = z.infer<typeof createRiskAssessmentResultSchema>

export const addRiskControlResultSchema = z.object({
  riskControlId: riskGuidSchema,
  correctiveActionId: riskGuidSchema.nullable().optional(),
})
export type AddRiskControlResult = z.infer<typeof addRiskControlResultSchema>

export const RISK_ACTION_PATH = {
  submitForReview: 'submit-for-review',
  approve: 'approve',
  returnToDraft: 'return-to-draft',
  archive: 'archive',
} as const satisfies Record<RiskAction, string>

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchRiskAssessments(filters: RiskFilters = {}): Promise<RiskAssessmentListItem[]> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments`, {
    query: { ...filters },
    schema: z.array(riskAssessmentListItemSchema),
  })
}

export function fetchRiskAssessment(id: string): Promise<RiskAssessment> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments/${id}`, { schema: riskAssessmentSchema })
}

export function fetchRiskMatrix(): Promise<RiskMatrixSummary> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments/risk-matrix`, {
    schema: riskMatrixSummarySchema,
  })
}

export function createRiskAssessment(
  payload: CreateRiskAssessmentPayload,
): Promise<CreateRiskAssessmentResult> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments`, {
    method: 'POST', body: payload, schema: createRiskAssessmentResultSchema,
  })
}

export function updateRiskAssessment(id: string, payload: UpdateRiskAssessmentPayload): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments/${id}`, { method: 'PUT', body: payload })
}

export function transitionRiskAssessment(id: string, action: RiskAction): Promise<void> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments/${id}/${RISK_ACTION_PATH[action]}`, {
    method: 'POST',
  })
}

export function addRiskControl(id: string, payload: AddRiskControlPayload): Promise<AddRiskControlResult> {
  return apiFetch(`${EHS_API_BASE}/risk-assessments/${id}/add-control`, {
    method: 'POST', body: payload, schema: addRiskControlResultSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useRiskAssessments(filters: RiskFilters = {}) {
  return useQuery({
    queryKey: ehsKeys.risks({ ...filters }),
    queryFn: () => fetchRiskAssessments(filters),
  })
}

export function useRiskAssessment(id: string | null) {
  return useQuery({
    queryKey: ehsKeys.risk(id ?? ''),
    queryFn: () => fetchRiskAssessment(id!),
    enabled: id !== null,
  })
}

export function useRiskMatrix() {
  return useQuery({ queryKey: ehsKeys.riskMatrix(), queryFn: fetchRiskMatrix })
}

export function invalidateRiskQueries(queryClient: QueryClient, invalidateCapas = false): void {
  void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'risks'] })
  void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'risk'] })
  void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'risk-matrix'] })
  if (invalidateCapas) {
    void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'capas'] })
  }
}

function useInvalidateRisks() {
  const queryClient = useQueryClient()
  return (invalidateCapas = false) => invalidateRiskQueries(queryClient, invalidateCapas)
}

export function useCreateRiskAssessment() {
  const invalidate = useInvalidateRisks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: createRiskAssessment,
    onSuccess: () => addToast('Kockázatértékelés létrehozva', 'success'),
    onError: (error) => addToast(error instanceof Error ? error.message : 'A létrehozás nem sikerült', 'error'),
    onSettled: () => invalidate(),
  })
}

export function useUpdateRiskAssessment() {
  const invalidate = useInvalidateRisks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRiskAssessmentPayload }) =>
      updateRiskAssessment(id, payload),
    onSuccess: () => addToast('Kockázatértékelés frissítve', 'success'),
    onError: (error) => addToast(error instanceof Error ? error.message : 'A módosítás nem sikerült', 'error'),
    onSettled: () => invalidate(),
  })
}

export function useRiskTransition() {
  const invalidate = useInvalidateRisks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: RiskAction }) =>
      transitionRiskAssessment(id, action),
    onError: (error) => addToast(error instanceof Error ? error.message : 'Az átmenet nem hajtható végre', 'error'),
    onSettled: () => invalidate(),
  })
}

export function useAddRiskControl() {
  const invalidate = useInvalidateRisks()
  const { addToast } = useToast()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddRiskControlPayload }) =>
      addRiskControl(id, payload),
    onSuccess: (result) => addToast(
      result.correctiveActionId ? 'Intézkedés és CAPA létrehozva' : 'Intézkedés rögzítve',
      'success',
    ),
    onError: (error) => addToast(error instanceof Error ? error.message : 'Az intézkedés rögzítése nem sikerült', 'error'),
    onSettled: () => invalidate(true),
  })
}

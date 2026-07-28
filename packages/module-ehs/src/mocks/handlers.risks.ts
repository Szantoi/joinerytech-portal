import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { EHS_API_BASE } from '../services/config'
import {
  RISK_ACTION_PATH,
  riskDateTimeSchema,
  riskGuidSchema,
  riskLevelSchema,
  riskLikelihoodSchema,
  riskSeveritySchema,
  riskStatusSchema,
  type RiskAssessment,
} from '../services/riskAssessments'
import { RISK_ASSESSMENT_FSM, type RiskAction } from '../services/fsm'
import type { Capa } from '../services/capa'
import {
  getEhsDb,
  guardTransition,
  jsonError,
  notFound,
  toRiskListItem,
} from './db'
import { buildRiskMatrixSummary, calculateMockRisk } from './riskMatrix'
import { TENANT_ID } from './seed'

const RISKS = `${EHS_API_BASE}/risk-assessments`
const guidSchema = z.string().uuid()
const futureDateSchema = riskDateTimeSchema
  .refine((value) => Date.parse(value) > Date.now(), 'A határidőnek jövőbelinek kell lennie.')
const nonBlank = (max: number) => z.string()
  .max(max)
  .refine((value) => value.trim().length > 0, 'A mező nem lehet üres.')

const createRiskSchema = z.object({
  hazardDescription: nonBlank(1000),
  severity: riskSeveritySchema,
  likelihood: riskLikelihoodSchema,
  assessedBy: riskGuidSchema,
  reviewDueDate: futureDateSchema,
  locationId: riskGuidSchema.nullable().optional(),
}).strict()

const updateRiskSchema = createRiskSchema.omit({ assessedBy: true })

const addControlSchema = z.object({
  controlMeasure: nonBlank(1000),
  responsiblePerson: nonBlank(200),
  capaDescription: z.string().max(1000).nullable().optional(),
  capaAssignedTo: riskGuidSchema.nullable().optional(),
  capaDueDate: futureDateSchema.nullable().optional(),
}).strict().superRefine((body, ctx) => {
  const hasAssignee = body.capaAssignedTo != null
  const hasDueDate = body.capaDueDate != null
  if (hasAssignee !== hasDueDate) {
    ctx.addIssue({
      code: 'custom',
      path: hasAssignee ? ['capaDueDate'] : ['capaAssignedTo'],
      message: 'A CAPA felelőse és határideje csak együtt adható meg.',
    })
  }
  if (hasAssignee && hasDueDate && body.capaDescription != null &&
      body.capaDescription.trim().length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['capaDescription'],
      message: 'A CAPA leírása nem lehet üres.',
    })
  }
})

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  }
  catch {
    return null
  }
}

function badInput(message = 'A kérés adatai érvénytelenek.') {
  return jsonError(400, 'BadRequest', message)
}

function findRisk(id: string) {
  return getEhsDb().risks.find((risk) => risk.riskAssessmentId === id)
}

function locationExists(locationId: string | null | undefined): boolean {
  return locationId == null || getEhsDb().locations.some(
    (location) => location.locationId === locationId,
  )
}

function transitionHandler(action: RiskAction) {
  return ({ params }: { params: Record<string, string | readonly string[]> }) => {
    const row = findRisk(params.id as string)
    if (!row) return notFound('Kockázatértékelés')
    const guard = guardTransition(RISK_ASSESSMENT_FSM, action, row.status)
    if (guard) return guard

    const now = new Date().toISOString()
    row.status = RISK_ASSESSMENT_FSM[action].to
    if (action === 'submitForReview') row.submittedAt = now
    if (action === 'approve') row.approvedAt = now
    if (action === 'returnToDraft') row.submittedAt = null
    if (action === 'archive') row.archivedAt = now
    return new HttpResponse(null, { status: 204 })
  }
}

export const riskHandlers = [
  http.get(`${RISKS}/risk-matrix`, () =>
    HttpResponse.json(buildRiskMatrixSummary(getEhsDb().risks))),

  http.get(RISKS, ({ request }) => {
    const url = new URL(request.url)
    const riskLevelValue = url.searchParams.get('riskLevel')
    const statusValue = url.searchParams.get('status')
    const locationId = url.searchParams.get('locationId')
    const reviewDueBefore = url.searchParams.get('reviewDueBefore')

    const riskLevel = riskLevelValue === null
      ? null
      : riskLevelSchema.safeParse(riskLevelValue)
    if (riskLevel !== null && !riskLevel.success) {
      return badInput(`Ismeretlen kockázati szint: '${riskLevelValue}'.`)
    }
    const status = statusValue === null ? null : riskStatusSchema.safeParse(statusValue)
    if (status !== null && !status.success) {
      return badInput(`Ismeretlen kockázatértékelés-státusz: '${statusValue}'.`)
    }
    if (locationId !== null && !guidSchema.safeParse(locationId).success) {
      return badInput('A locationId nem érvényes azonosító.')
    }
    if (reviewDueBefore !== null && !riskDateTimeSchema.safeParse(reviewDueBefore).success) {
      return badInput('A reviewDueBefore nem érvényes dátum.')
    }

    let rows = getEhsDb().risks
    if (riskLevel?.success) rows = rows.filter((row) => row.riskLevel === riskLevel.data)
    if (status?.success) rows = rows.filter((row) => row.status === status.data)
    if (locationId !== null) rows = rows.filter((row) => row.locationId === locationId)
    if (reviewDueBefore !== null) {
      const upperBound = Date.parse(reviewDueBefore)
      rows = rows.filter((row) => Date.parse(row.reviewDueDate) <= upperBound)
    }

    return HttpResponse.json([...rows]
      .sort((left, right) =>
        right.riskScore - left.riskScore ||
        left.reviewDueDate.localeCompare(right.reviewDueDate))
      .map(toRiskListItem))
  }),

  http.get(`${RISKS}/:id`, ({ params }) => {
    const row = findRisk(params.id as string)
    return row ? HttpResponse.json(row) : notFound('Kockázatértékelés')
  }),

  http.post(RISKS, async ({ request }) => {
    const parsed = createRiskSchema.safeParse(await readJson(request))
    if (!parsed.success) return badInput()
    if (!locationExists(parsed.data.locationId)) {
      return jsonError(409, 'Conflict', 'A megadott helyszín nem található.')
    }

    const now = new Date().toISOString()
    const row: RiskAssessment = {
      riskAssessmentId: crypto.randomUUID(),
      tenantId: TENANT_ID,
      hazardDescription: parsed.data.hazardDescription,
      locationId: parsed.data.locationId ?? null,
      severity: parsed.data.severity,
      likelihood: parsed.data.likelihood,
      ...calculateMockRisk(parsed.data.severity, parsed.data.likelihood),
      status: 'piszkozat',
      assessedBy: parsed.data.assessedBy,
      assessedAt: now,
      reviewDueDate: parsed.data.reviewDueDate,
      submittedAt: null,
      approvedAt: null,
      archivedAt: null,
      controlMeasures: [],
    }
    getEhsDb().risks.push(row)
    return HttpResponse.json({ riskAssessmentId: row.riskAssessmentId }, { status: 201 })
  }),

  http.put(`${RISKS}/:id`, async ({ params, request }) => {
    const parsed = updateRiskSchema.safeParse(await readJson(request))
    if (!parsed.success) return badInput()
    const row = findRisk(params.id as string)
    if (!row) return notFound('Kockázatértékelés')
    if (!locationExists(parsed.data.locationId)) {
      return jsonError(409, 'Conflict', 'A megadott helyszín nem található.')
    }
    if (row.status !== 'piszkozat') {
      return jsonError(409, 'Conflict', 'Csak piszkozat kockázatértékelés módosítható.')
    }

    row.hazardDescription = parsed.data.hazardDescription
    row.locationId = parsed.data.locationId ?? null
    row.severity = parsed.data.severity
    row.likelihood = parsed.data.likelihood
    Object.assign(row, calculateMockRisk(parsed.data.severity, parsed.data.likelihood))
    row.reviewDueDate = parsed.data.reviewDueDate
    return new HttpResponse(null, { status: 204 })
  }),

  ...Object.entries(RISK_ACTION_PATH).map(([action, path]) =>
    http.post(`${RISKS}/:id/${path}`, transitionHandler(action as RiskAction))),

  http.post(`${RISKS}/:id/add-control`, async ({ params, request }) => {
    const parsed = addControlSchema.safeParse(await readJson(request))
    if (!parsed.success) return badInput()
    const row = findRisk(params.id as string)
    if (!row) return notFound('Kockázatértékelés')
    if (row.status === 'archivalt') {
      return jsonError(409, 'Conflict', 'Archivált kockázatértékeléshez nem adható intézkedés.')
    }

    const riskControlId = crypto.randomUUID()
    const correctiveActionId = parsed.data.capaAssignedTo && parsed.data.capaDueDate
      ? crypto.randomUUID()
      : null
    const control: RiskAssessment['controlMeasures'][number] = {
      riskControlId,
      controlMeasure: parsed.data.controlMeasure,
      responsiblePerson: parsed.data.responsiblePerson,
      implementedAt: new Date().toISOString(),
      verifiedAt: null,
      isVerified: false,
      correctiveActionId,
    }
    let capa: Capa | null = null
    if (correctiveActionId && parsed.data.capaAssignedTo && parsed.data.capaDueDate) {
      capa = {
        correctiveActionId,
        tenantId: TENANT_ID,
        source: 'kockazatertekeles',
        sourceId: row.riskAssessmentId,
        description: parsed.data.capaDescription ?? parsed.data.controlMeasure,
        assignedTo: parsed.data.capaAssignedTo,
        dueDate: parsed.data.capaDueDate,
        completedAt: null,
        isCompleted: false,
      }
    }

    row.controlMeasures.push(control)
    if (capa) getEhsDb().capas.push(capa)
    return HttpResponse.json({ riskControlId, correctiveActionId }, { status: 201 })
  }),
]

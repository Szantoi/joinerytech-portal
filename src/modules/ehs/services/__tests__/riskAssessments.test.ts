import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { canTransition, RISK_ASSESSMENT_FSM } from '../fsm'
import {
  RISK_ACTION_PATH,
  RISK_LIKELIHOODS,
  RISK_SEVERITIES,
  invalidateRiskQueries,
  riskAssessmentSchema,
  riskAssessmentListItemSchema,
  riskDateTimeSchema,
  riskGuidSchema,
  riskMatrixSummarySchema,
  type RiskMatrixCell,
} from '../riskAssessments'

const listItem = {
  riskAssessmentId: '00000000-0000-4000-8000-000000001001',
  hazardDescription: 'Forgó alkatrész elérése',
  locationId: '00000000-0000-4000-8000-000000002001',
  severity: 'sulyos',
  likelihood: 'lehetseges',
  riskScore: 12,
  riskLevel: 'magas',
  status: 'ellenorzes',
  assessedAt: '2026-07-22T10:00:00Z',
  reviewDueDate: '2026-10-22T10:00:00Z',
} as const

function matrixCells(): RiskMatrixCell[] {
  return RISK_SEVERITIES.flatMap((severity) =>
    RISK_LIKELIHOODS.map((likelihood) => ({
      severity,
      likelihood,
      count: 0,
      riskLevel: 'alacsony',
    })),
  )
}

describe('risk assessment ADR-059 wire contract', () => {
  it('elfogadja a kanonikus magyar lista DTO-t', () => {
    expect(riskAssessmentListItemSchema.parse(listItem)).toEqual(listItem)
  })

  it('elutasítja az angol enum-kulcsokat', () => {
    expect(() => riskAssessmentListItemSchema.parse({
      ...listItem,
      severity: 'Major',
      likelihood: 'Possible',
      riskLevel: 'High',
      status: 'UnderReview',
    })).toThrow()
  })

  it('elutasítja a nil GUID-ot és a nem létező RFC 3339 dátumot', () => {
    expect(riskGuidSchema.safeParse('00000000-0000-0000-0000-000000000000').success)
      .toBe(false)
    expect(riskDateTimeSchema.safeParse('2027-02-30T10:00:00Z').success).toBe(false)
    expect(riskDateTimeSchema.safeParse('2027-02-28T10:00:00+01:00').success).toBe(true)
  })

  it('response contractként minden risk ID-t és dátumot validál', () => {
    expect(() => riskAssessmentListItemSchema.parse({
      ...listItem,
      riskAssessmentId: '00000000-0000-0000-0000-000000000000',
    })).toThrow()
    expect(() => riskAssessmentListItemSchema.parse({
      ...listItem,
      reviewDueDate: '2027-02-30T10:00:00Z',
    })).toThrow()
    expect(() => riskAssessmentSchema.parse({
      ...listItem,
      tenantId: listItem.riskAssessmentId,
      assessedBy: listItem.riskAssessmentId,
      submittedAt: null,
      approvedAt: null,
      archivedAt: null,
      controlMeasures: [{
        riskControlId: listItem.riskAssessmentId,
        controlMeasure: 'Védőburkolat',
        responsiblePerson: 'Műszakvezető',
        implementedAt: '2027-02-30T10:00:00Z',
        verifiedAt: null,
        isVerified: false,
        correctiveActionId: null,
      }],
    })).toThrow()
  })

  it('pontosan 25 egyedi cellát és konzisztens totalCountot követel', () => {
    const cells = matrixCells()
    expect(riskMatrixSummarySchema.parse({
      totalAssessments: 0,
      byRiskLevel: {},
      byStatus: {},
      matrixCells: cells,
    }).matrixCells).toHaveLength(25)

    expect(() => riskMatrixSummarySchema.parse({
      totalAssessments: 0,
      byRiskLevel: {},
      byStatus: {},
      matrixCells: cells.slice(1),
    })).toThrow(/25 egyedi|Hiányzó/)

    expect(() => riskMatrixSummarySchema.parse({
      totalAssessments: 1,
      byRiskLevel: { alacsony: 1 },
      byStatus: { piszkozat: 1 },
      matrixCells: cells,
    })).toThrow(/cellaösszege/)
  })

  it('a két bontás összegét is egyezteti, és kizárja az archivált elemeket', () => {
    const cells = matrixCells()
    cells[0].count = 1

    expect(riskMatrixSummarySchema.parse({
      totalAssessments: 1,
      byRiskLevel: { alacsony: 1 },
      byStatus: { piszkozat: 1 },
      matrixCells: cells,
    }).totalAssessments).toBe(1)

    expect(() => riskMatrixSummarySchema.parse({
      totalAssessments: 1,
      byRiskLevel: { alacsony: 0 },
      byStatus: { piszkozat: 1 },
      matrixCells: cells,
    })).toThrow(/kockázati szint szerinti bontás/)

    expect(() => riskMatrixSummarySchema.parse({
      totalAssessments: 1,
      byRiskLevel: { alacsony: 1 },
      byStatus: { archivalt: 1 },
      matrixCells: cells,
    })).toThrow(/archivált/)
  })

  it('szintenként is egyezteti a byRiskLevel bontást a cellákkal', () => {
    const cells = matrixCells()
    cells[0] = { ...cells[0], count: 1, riskLevel: 'magas' }

    expect(() => riskMatrixSummarySchema.parse({
      totalAssessments: 1,
      byRiskLevel: { alacsony: 1 },
      byStatus: { piszkozat: 1 },
      matrixCells: cells,
    })).toThrow(/nem egyezik a mátrix celláival/)
  })
})

describe('risk query invalidation contract', () => {
  it('minden risk mutáció list/detail/matrix cache-t invalidál', () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateRiskQueries(queryClient)

    expect(invalidate).toHaveBeenCalledTimes(3)
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      ['ehs', 'risks'],
      ['ehs', 'risk'],
      ['ehs', 'risk-matrix'],
    ])
  })

  it('CAPA-t létrehozható control után a CAPA cache-t is invalidálja', () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateRiskQueries(queryClient, true)

    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toContainEqual([
      'ehs', 'capas',
    ])
  })
})

describe('risk assessment FSM', () => {
  it.each([
    ['submitForReview', 'piszkozat', 'submit-for-review'],
    ['approve', 'ellenorzes', 'approve'],
    ['returnToDraft', 'ellenorzes', 'return-to-draft'],
    ['archive', 'jovahagyva', 'archive'],
  ] as const)('%s akció a megfelelő státuszból és endpointtal engedélyezett', (action, status, path) => {
    expect(canTransition(RISK_ASSESSMENT_FSM, action, status)).toBe(true)
    expect(RISK_ACTION_PATH[action]).toBe(path)
  })

  it('tiltja a backend FSM-en kívüli átmeneteket', () => {
    expect(canTransition(RISK_ASSESSMENT_FSM, 'approve', 'piszkozat')).toBe(false)
    expect(canTransition(RISK_ASSESSMENT_FSM, 'archive', 'ellenorzes')).toBe(false)
    expect(canTransition(RISK_ASSESSMENT_FSM, 'submitForReview', 'archivalt')).toBe(false)
  })
})

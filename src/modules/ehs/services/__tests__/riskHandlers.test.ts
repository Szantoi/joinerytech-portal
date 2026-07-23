import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, getEhsDb, resetEhsDb, SEED_IDS, daysFromNow } from '../../mocks'
import { fetchCapas } from '../capa'
import {
  addRiskControl,
  createRiskAssessment,
  fetchRiskAssessment,
  fetchRiskAssessments,
  fetchRiskMatrix,
  transitionRiskAssessment,
  updateRiskAssessment,
  type AddRiskControlPayload,
  type CreateRiskAssessmentPayload,
  type RiskFilters,
} from '../riskAssessments'

const server = setupServer(...ehsApiHandlers)
const EMPLOYEE_ID = '11111111-1111-4111-8111-111111111112'
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999'
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'
const INVALID_DATE = '2027-02-30T10:00:00Z'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createPayload(overrides: Partial<CreateRiskAssessmentPayload> = {}): CreateRiskAssessmentPayload {
  return {
    hazardDescription: 'Teszt veszélyforrás',
    severity: 'kozepes',
    likelihood: 'lehetseges',
    assessedBy: EMPLOYEE_ID,
    reviewDueDate: daysFromNow(30),
    locationId: SEED_IDS.locHallA,
    ...overrides,
  }
}

describe('risk MSW seed és 5×5 matrix', () => {
  it('minden státuszt és sávot tartalmaz, egyedi ID-kkel és kétirányú CAPA-linkkel', async () => {
    const rows = await fetchRiskAssessments()
    const ids = Object.values(SEED_IDS)
    const linked = await fetchRiskAssessment(SEED_IDS.riskWithCapa)
    const capas = await fetchCapas({ source: 'kockazatertekeles' })

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(rows.map((row) => row.status))).toEqual(
      new Set(['piszkozat', 'ellenorzes', 'jovahagyva', 'archivalt']),
    )
    expect(new Set(rows.map((row) => row.riskLevel))).toEqual(
      new Set(['alacsony', 'kozepes', 'magas', 'kritikus']),
    )
    expect(linked.controlMeasures[0].correctiveActionId).toBe(SEED_IDS.capaRiskOpen)
    expect(capas.find((capa) => capa.correctiveActionId === SEED_IDS.capaRiskOpen)?.sourceId)
      .toBe(SEED_IDS.riskWithCapa)
  })

  it('25 cellát ad, az archivált rekordot kizárja és üres/többes cellát is tartalmaz', async () => {
    const matrix = await fetchRiskMatrix()

    expect(matrix.matrixCells).toHaveLength(25)
    expect(matrix.totalAssessments).toBe(5)
    expect(matrix.byStatus.archivalt ?? 0).toBe(0)
    expect(matrix.matrixCells.some((cell) => cell.count === 0)).toBe(true)
    expect(matrix.matrixCells.some((cell) => cell.count > 1)).toBe(true)
  })
})

describe('risk lista és detail contract', () => {
  it('külön és kombinálva alkalmazza a négy filtert, backend-rendezéssel', async () => {
    const all = await fetchRiskAssessments()
    const combined = await fetchRiskAssessments({
      riskLevel: 'magas',
      status: 'jovahagyva',
      locationId: SEED_IDS.locHallA,
      reviewDueBefore: daysFromNow(13),
    })
    const dueInclusive = await fetchRiskAssessments({
      reviewDueBefore: all.find((row) => row.riskAssessmentId === SEED_IDS.riskWithCapa)!.reviewDueDate,
    })

    expect(all.map((row) => row.riskScore)).toEqual(
      [...all].sort((a, b) => b.riskScore - a.riskScore ||
        a.reviewDueDate.localeCompare(b.reviewDueDate)).map((row) => row.riskScore),
    )
    expect(combined.map((row) => row.riskAssessmentId)).toEqual([SEED_IDS.riskWithCapa])
    expect(dueInclusive.some((row) => row.riskAssessmentId === SEED_IDS.riskWithCapa)).toBe(true)
    await expect(fetchRiskAssessments({ locationId: UNKNOWN_ID })).resolves.toEqual([])
  })

  it.each([
    { riskLevel: '' },
    { riskLevel: 'High' },
    { status: 'UnderReview' },
    { status: 'Jovahagyva' },
  ] as const)('400-at ad nem kanonikus enum filterre: %o', async (filters) => {
    await expect(fetchRiskAssessments(filters as unknown as RiskFilters))
      .rejects.toThrow(/Ismeretlen/)
  })

  it('detail 200 és ismeretlen ID 404', async () => {
    await expect(fetchRiskAssessment(SEED_IDS.riskDraftLow))
      .resolves.toMatchObject({ riskAssessmentId: SEED_IDS.riskDraftLow })
    await expect(fetchRiskAssessment(UNKNOWN_ID)).rejects.toThrow(/nem található/)
  })
})

describe('risk create/update contract', () => {
  it('201 piszkozatot hoz létre, és inaktív, de létező locationt is elfogad', async () => {
    const created = await createRiskAssessment(createPayload({ locationId: SEED_IDS.locInactive }))
    const row = await fetchRiskAssessment(created.riskAssessmentId)

    expect(row).toMatchObject({
      status: 'piszkozat',
      locationId: SEED_IDS.locInactive,
      riskScore: 9,
      riskLevel: 'kozepes',
      controlMeasures: [],
    })
  })

  it('400 hibás inputra és 409 nem létező locationre', async () => {
    const before = getEhsDb().risks.length
    await expect(createRiskAssessment(createPayload({ hazardDescription: ' ' })))
      .rejects.toThrow(/érvénytelen/)
    await expect(createRiskAssessment(createPayload({ reviewDueDate: daysFromNow(-1) })))
      .rejects.toThrow(/érvénytelen/)
    await expect(createRiskAssessment(createPayload({ reviewDueDate: INVALID_DATE })))
      .rejects.toThrow(/érvénytelen/)
    await expect(createRiskAssessment(createPayload({ assessedBy: EMPTY_GUID })))
      .rejects.toThrow(/érvénytelen/)
    await expect(createRiskAssessment(createPayload({ locationId: EMPTY_GUID })))
      .rejects.toThrow(/érvénytelen/)
    await expect(createRiskAssessment(createPayload({ locationId: UNKNOWN_ID })))
      .rejects.toThrow(/helyszín nem található/)
    expect(getEhsDb().risks).toHaveLength(before)
  })

  it('szigorúan validálja a lista date-time és location filterét', async () => {
    await expect(fetchRiskAssessments({ reviewDueBefore: INVALID_DATE }))
      .rejects.toThrow(/reviewDueBefore/)
    await expect(fetchRiskAssessments({ locationId: EMPTY_GUID })).resolves.toEqual([])
  })

  it('csak piszkozatot frissít, újraszámítva a score/band mezőt', async () => {
    const before = await fetchRiskAssessment(SEED_IDS.riskDraftLow)
    await updateRiskAssessment(SEED_IDS.riskDraftLow, {
      hazardDescription: 'Frissített veszély',
      severity: 'katasztrofalis',
      likelihood: 'szinte_biztos',
      reviewDueDate: daysFromNow(90),
      locationId: null,
    })
    const after = await fetchRiskAssessment(SEED_IDS.riskDraftLow)

    expect(after).toMatchObject({
      hazardDescription: 'Frissített veszély', riskScore: 25, riskLevel: 'kritikus',
      assessedBy: before.assessedBy, assessedAt: before.assessedAt, locationId: null,
    })
    await expect(updateRiskAssessment(SEED_IDS.riskWithCapa, {
      hazardDescription: 'Tiltott', severity: 'enyhe', likelihood: 'ritka',
      reviewDueDate: daysFromNow(10), locationId: null,
    })).rejects.toThrow(/Csak piszkozat/)
    await expect(updateRiskAssessment(UNKNOWN_ID, {
      hazardDescription: 'Hiányzó', severity: 'enyhe', likelihood: 'ritka',
      reviewDueDate: daysFromNow(10), locationId: null,
    })).rejects.toThrow(/nem található/)
  })
})

describe('risk FSM és control/CAPA contract', () => {
  it('végigviszi a négy FSM útvonalat és tiltott átmenetre 409-et ad', async () => {
    await transitionRiskAssessment(SEED_IDS.riskDraftLow, 'submitForReview')
    expect((await fetchRiskAssessment(SEED_IDS.riskDraftLow)).submittedAt).not.toBeNull()
    await transitionRiskAssessment(SEED_IDS.riskDraftLow, 'returnToDraft')
    expect((await fetchRiskAssessment(SEED_IDS.riskDraftLow)).submittedAt).toBeNull()
    await transitionRiskAssessment(SEED_IDS.riskDraftLow, 'submitForReview')
    await transitionRiskAssessment(SEED_IDS.riskDraftLow, 'approve')
    await transitionRiskAssessment(SEED_IDS.riskDraftLow, 'archive')
    expect((await fetchRiskAssessment(SEED_IDS.riskDraftLow)).status).toBe('archivalt')

    await expect(transitionRiskAssessment(SEED_IDS.riskDraftLow, 'approve'))
      .rejects.toThrow(/Érvénytelen FSM-átmenet/)
    await expect(transitionRiskAssessment(UNKNOWN_ID, 'archive'))
      .rejects.toThrow(/nem található/)
  })

  it('controlt CAPA nélkül és atomikusan CAPA-val is létrehoz', async () => {
    const simple = await addRiskControl(SEED_IDS.riskReviewMedium, {
      controlMeasure: 'Elszívás napi ellenőrzése',
      responsiblePerson: 'Műszakvezető',
    })
    expect(simple.correctiveActionId ?? null).toBeNull()

    const withCapa = await addRiskControl(SEED_IDS.riskApprovedCritical, {
      controlMeasure: 'Robbanásbiztos elszívás kiépítése',
      responsiblePerson: 'Karbantartási vezető',
      capaAssignedTo: EMPLOYEE_ID,
      capaDueDate: daysFromNow(10),
    })
    const detail = await fetchRiskAssessment(SEED_IDS.riskApprovedCritical)
    const capas = await fetchCapas({ source: 'kockazatertekeles', sourceId: SEED_IDS.riskApprovedCritical })

    expect(withCapa.correctiveActionId).toBeTruthy()
    expect(detail.controlMeasures.at(-1)?.correctiveActionId).toBe(withCapa.correctiveActionId)
    expect(capas.at(-1)).toMatchObject({
      correctiveActionId: withCapa.correctiveActionId,
      description: 'Robbanásbiztos elszívás kiépítése',
    })
  })

  it('féloldalas CAPA-párt 400-zal, archivált risket 409-cel utasít el mutáció nélkül', async () => {
    const before = getEhsDb().risks.find(
      (row) => row.riskAssessmentId === SEED_IDS.riskReviewMedium,
    )!.controlMeasures.length
    const incomplete: AddRiskControlPayload = {
      controlMeasure: 'Nem maradhat bent',
      responsiblePerson: 'Tesztelő',
      capaAssignedTo: EMPLOYEE_ID,
    }

    await expect(addRiskControl(SEED_IDS.riskReviewMedium, incomplete))
      .rejects.toThrow(/érvénytelen/)
    await expect(addRiskControl(SEED_IDS.riskReviewMedium, {
      controlMeasure: 'Nil GUID-dal sem maradhat bent',
      responsiblePerson: 'Tesztelő',
      capaAssignedTo: EMPTY_GUID,
      capaDueDate: daysFromNow(10),
    })).rejects.toThrow(/érvénytelen/)
    await expect(addRiskControl(SEED_IDS.riskReviewMedium, {
      controlMeasure: 'Hibás dátummal sem maradhat bent',
      responsiblePerson: 'Tesztelő',
      capaAssignedTo: EMPLOYEE_ID,
      capaDueDate: INVALID_DATE,
    })).rejects.toThrow(/érvénytelen/)
    expect(getEhsDb().risks.find(
      (row) => row.riskAssessmentId === SEED_IDS.riskReviewMedium,
    )!.controlMeasures).toHaveLength(before)
    await expect(addRiskControl(SEED_IDS.riskArchived, {
      controlMeasure: 'Tiltott', responsiblePerson: 'Tesztelő',
    })).rejects.toThrow(/Archivált/)
  })

  it('CAPA nélküli üres leírást a backendhez hasonlóan figyelmen kívül hagy', async () => {
    await expect(addRiskControl(SEED_IDS.riskReviewMedium, {
      controlMeasure: 'Egyszerű intézkedés',
      responsiblePerson: 'Tesztelő',
      capaDescription: '',
    })).resolves.toMatchObject({ correctiveActionId: null })
  })

  it.each(['', '   '])(
    'CAPA-pár mellett a(z) %o üres leírást atomikusan elutasítja',
    async (capaDescription) => {
      const risk = getEhsDb().risks.find(
        (row) => row.riskAssessmentId === SEED_IDS.riskReviewMedium,
      )!
      const controlsBefore = risk.controlMeasures.length
      const capasBefore = getEhsDb().capas.length

      await expect(addRiskControl(SEED_IDS.riskReviewMedium, {
        controlMeasure: 'Nem maradhat bent',
        responsiblePerson: 'Tesztelő',
        capaDescription,
        capaAssignedTo: EMPLOYEE_ID,
        capaDueDate: daysFromNow(10),
      })).rejects.toThrow(/érvénytelen/)

      expect(risk.controlMeasures).toHaveLength(controlsBefore)
      expect(getEhsDb().capas).toHaveLength(capasBefore)
    },
  )

  it('create és archive után konzisztensen változik a matrix', async () => {
    const before = await fetchRiskMatrix()
    const created = await createRiskAssessment(createPayload())
    expect((await fetchRiskMatrix()).totalAssessments).toBe(before.totalAssessments + 1)
    await transitionRiskAssessment(created.riskAssessmentId, 'submitForReview')
    await transitionRiskAssessment(created.riskAssessmentId, 'approve')
    await transitionRiskAssessment(created.riskAssessmentId, 'archive')
    expect((await fetchRiskMatrix()).totalAssessments).toBe(before.totalAssessments)
  })
})

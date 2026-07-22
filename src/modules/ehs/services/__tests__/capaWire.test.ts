import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb } from '../../mocks'
import {
  CAPA_SOURCES,
  capaSourceSchema,
  type CapaSource,
  fetchCapas,
} from '../capa'

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('CAPA ADR-059 source wire contract', () => {
  it.each(CAPA_SOURCES)('%s forrás magyar kulccsal szűrhető', async (source) => {
    const rows = await fetchCapas({ source })

    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.source === source)).toBe(true)
  })

  it.each(['Incident', 'SafetyWalk', 'RiskAssessment'])('elutasítja az angol %s kulcsot', async (source) => {
    expect(capaSourceSchema.safeParse(source).success).toBe(false)

    await expect(fetchCapas({ source: source as CapaSource }))
      .rejects.toThrow(/Ismeretlen CAPA-forrás-kulcs/)
  })
})

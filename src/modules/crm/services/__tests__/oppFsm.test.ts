import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, CRM_SEED_IDS } from '../../mocks'
import { fetchOpp, fetchOpps, transitionOpp, createQuoteFromOpp } from '../opportunities'
import { ApiError } from '../../../../services/apiClient'
import {
  OPP_FSM, OPP_STAGE_PROBABILITY, canTransition, nextOppAction, weightedValue,
} from '../fsm'

/** Opportunity-FSM: fő lánc + guard (409) utak + ajánlat-csonk handoff. */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('OPP_FSM guard táblák és fázis-valószínűségek', () => {
  it('win csak targyalas fázisból indítható', () => {
    expect(canTransition(OPP_FSM, 'win', 'targyalas')).toBe(true)
    expect(canTransition(OPP_FSM, 'win', 'ajanlat')).toBe(false)
    expect(canTransition(OPP_FSM, 'win', 'megnyert')).toBe(false)
  })

  it('lose bármely nyitott fázisból megy, terminálisból nem', () => {
    expect(canTransition(OPP_FSM, 'lose', 'nyitott')).toBe(true)
    expect(canTransition(OPP_FSM, 'lose', 'targyalas')).toBe(true)
    expect(canTransition(OPP_FSM, 'lose', 'megnyert')).toBe(false)
    expect(canTransition(OPP_FSM, 'lose', 'elveszett')).toBe(false)
  })

  it('nextOppAction a fő lánc következő lépését adja, terminálisnál nincs', () => {
    expect(nextOppAction('nyitott')).toBe('startDiscovery')
    expect(nextOppAction('targyalas')).toBe('win')
    expect(nextOppAction('megnyert')).toBeUndefined()
    expect(nextOppAction('elveszett')).toBeUndefined()
  })

  it('a súlyozott érték a fázis-valószínűséggel számol', () => {
    expect(OPP_STAGE_PROBABILITY.targyalas).toBe(0.8)
    expect(weightedValue(1_000_000, 'targyalas')).toBe(800_000)
    expect(weightedValue(1_000_000, 'elveszett')).toBe(0)
    expect(weightedValue(1_000_000, 'megnyert')).toBe(1_000_000)
  })
})

describe('lehetőség FSM-átmenetek az API-n', () => {
  it('végigjárja a teljes fő láncot: nyitott → … → megnyert', async () => {
    const id = CRM_SEED_IDS.oppOpen

    expect((await transitionOpp(id, 'startDiscovery', {})).status).toBe('igenyfelmeres')
    expect((await transitionOpp(id, 'startProposal', {})).status).toBe('osszeallitas')
    expect((await transitionOpp(id, 'sendQuote', {})).status).toBe('ajanlat')
    expect((await transitionOpp(id, 'negotiate', {})).status).toBe('targyalas')

    const won = await transitionOpp(id, 'win', {})
    expect(won.status).toBe('megnyert')
    expect(won.wonAt).toBeTruthy()
  })

  it('tiltott átmenet (fázis-ugrás) → 409 Conflict', async () => {
    const error = await transitionOpp(CRM_SEED_IDS.oppOpen, 'win', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('Érvénytelen FSM-átmenet')
  })

  it('409 után az állapot változatlan marad', async () => {
    await transitionOpp(CRM_SEED_IDS.oppOpen, 'sendQuote', {}).catch(() => {})
    const opp = await fetchOpp(CRM_SEED_IDS.oppOpen)
    expect(opp.status).toBe('nyitott')
  })

  it('lose indokkal: elveszett + lostReason; indok nélkül 400', async () => {
    const lost = await transitionOpp(CRM_SEED_IDS.oppDiscovery, 'lose', { reason: 'Árban alulmaradtunk.' })
    expect(lost.status).toBe('elveszett')
    expect(lost.lostReason).toBe('Árban alulmaradtunk.')

    const error = await transitionOpp(CRM_SEED_IDS.oppOpen, 'lose', { reason: '' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('megnyert lehetőség nem veszíthető el → 409', async () => {
    const error = await transitionOpp(CRM_SEED_IDS.oppWon, 'lose', { reason: 'x' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })
})

describe('oppCreateQuote handoff (draft ajánlat-csonk)', () => {
  it('ajánlat-csonkot hoz létre és a lehetőséghez köti', async () => {
    const result = await createQuoteFromOpp(CRM_SEED_IDS.oppOpen)
    expect(result.quoteId).toMatch(/^Q-2426-\d{3}$/)
    expect(result.opportunity.quoteId).toBe(result.quoteId)

    const opp = await fetchOpp(CRM_SEED_IDS.oppOpen)
    expect(opp.quoteId).toBe(result.quoteId)
  })

  it('meglévő ajánlat mellett nem hozható létre újabb → 409', async () => {
    const error = await createQuoteFromOpp(CRM_SEED_IDS.oppQuoted).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('már tartozik ajánlat')
  })

  it('lezárt lehetőséghez nem hozható létre ajánlat → 409', async () => {
    const error = await createQuoteFromOpp(CRM_SEED_IDS.oppLost).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('a lista open=true szűrője csak nyitott fázisokat ad', async () => {
    const open = await fetchOpps({ open: true })
    expect(open.length).toBeGreaterThan(0)
    expect(open.every((o) => !['megnyert', 'elveszett'].includes(o.status))).toBe(true)
  })
})

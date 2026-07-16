import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { crmApiHandlers, resetCrmDb, CRM_SEED_IDS } from '../../mocks'
import { fetchLead, fetchLeads, transitionLead, convertLeadToOpp, addLeadActivity } from '../leads'
import { fetchOpp } from '../opportunities'
import { ApiError } from '../../../../services/apiClient'
import { LEAD_FSM, canTransition, transitionBlockReason } from '../fsm'
import { LEAD_STATUS_LABELS } from '../../pages/labels'

/** Lead-FSM: legális lánc + guard (409) utak az MSW kontraktus-tükrön. */

const server = setupServer(...crmApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetCrmDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('LEAD_FSM guard táblák (UI + mock közös igazságforrás)', () => {
  it('contact csak uj állapotból indítható', () => {
    expect(canTransition(LEAD_FSM, 'contact', 'uj')).toBe(true)
    expect(canTransition(LEAD_FSM, 'contact', 'kapcsolat')).toBe(false)
    expect(canTransition(LEAD_FSM, 'contact', 'konvertalva')).toBe(false)
  })

  it('convert minosites és nurturing állapotból is indítható, máshonnan nem', () => {
    expect(canTransition(LEAD_FSM, 'convert', 'minosites')).toBe(true)
    expect(canTransition(LEAD_FSM, 'convert', 'nurturing')).toBe(true)
    expect(canTransition(LEAD_FSM, 'convert', 'uj')).toBe(false)
    expect(canTransition(LEAD_FSM, 'convert', 'elvetve')).toBe(false)
  })

  it('discard bármely nyitott állapotból megy, terminálisból nem', () => {
    expect(canTransition(LEAD_FSM, 'discard', 'uj')).toBe(true)
    expect(canTransition(LEAD_FSM, 'discard', 'nurturing')).toBe(true)
    expect(canTransition(LEAD_FSM, 'discard', 'konvertalva')).toBe(false)
    expect(canTransition(LEAD_FSM, 'discard', 'elvetve')).toBe(false)
  })

  it('tiltott átmenetre magyar indoklást ad (Button disabledReason)', () => {
    const reason = transitionBlockReason(LEAD_FSM, 'qualify', 'uj', LEAD_STATUS_LABELS)
    expect(reason).toContain('Kapcsolatfelvétel')
    expect(reason).toContain('Új')
    expect(transitionBlockReason(LEAD_FSM, 'contact', 'uj', LEAD_STATUS_LABELS)).toBeUndefined()
  })
})

describe('lead FSM-átmenetek az API-n', () => {
  it('végigjárja a fő láncot: uj → kapcsolat → minosites → nurturing', async () => {
    const id = CRM_SEED_IDS.leadNew

    const contacted = await transitionLead(id, 'contact', {})
    expect(contacted.status).toBe('kapcsolat')

    const qualified = await transitionLead(id, 'qualify', { note: 'Minősítve a felmérés után.' })
    expect(qualified.status).toBe('minosites')

    const nurturing = await transitionLead(id, 'nurture', {})
    expect(nurturing.status).toBe('nurturing')
    // minden átmenet napló-bejegyzést ír
    expect(nurturing.activities.length).toBeGreaterThanOrEqual(4)
  })

  it('convertLeadToOpp: lehetőség-csonk jön létre és a lead terminális lesz', async () => {
    const result = await convertLeadToOpp(CRM_SEED_IDS.leadQualified)
    expect(result.lead.status).toBe('konvertalva')
    expect(result.lead.oppId).toBe(result.opportunityId)

    const opp = await fetchOpp(result.opportunityId)
    expect(opp.status).toBe('nyitott')
    expect(opp.fromLead).toBe(CRM_SEED_IDS.leadQualified)
    expect(opp.value).toBe(result.lead.estValue)
  })

  it('tiltott átmenet → 409 Conflict (a leendő backend guard előképe)', async () => {
    const error = await transitionLead(CRM_SEED_IDS.leadNew, 'qualify', {})
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('Érvénytelen FSM-átmenet')
  })

  it('konvertált lead nem konvertálható újra → 409', async () => {
    const error = await convertLeadToOpp(CRM_SEED_IDS.leadConverted).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('409 után az állapot változatlan marad (a szerver az igazságforrás)', async () => {
    await transitionLead(CRM_SEED_IDS.leadNew, 'qualify', {}).catch(() => {})
    const lead = await fetchLead(CRM_SEED_IDS.leadNew)
    expect(lead.status).toBe('uj')
  })

  it('discard indok nélkül → 400', async () => {
    const error = await transitionLead(CRM_SEED_IDS.leadNew, 'discard', { reason: ' ' })
      .catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(400)
  })

  it('discard indokkal: elvetve + lostReason tárolva', async () => {
    const discarded = await transitionLead(CRM_SEED_IDS.leadContacted, 'discard', {
      reason: 'Nem a profilunk.',
    })
    expect(discarded.status).toBe('elvetve')
    expect(discarded.lostReason).toBe('Nem a profilunk.')
  })

  it('a lista státusz- és szöveg-szűrője működik', async () => {
    const nurturing = await fetchLeads({ status: 'nurturing' })
    expect(nurturing.length).toBeGreaterThan(0)
    expect(nurturing.every((l) => l.status === 'nurturing')).toBe(true)

    const search = await fetchLeads({ q: 'novitech' })
    expect(search.map((l) => l.id)).toContain(CRM_SEED_IDS.leadContacted)
  })

  it('napló-bejegyzés rögzíthető', async () => {
    const lead = await addLeadActivity(CRM_SEED_IDS.leadNew, {
      kind: 'hivas',
      who: 'Szabó A.',
      text: 'Első hívás megtörtént.',
    })
    expect(lead.activities.some((a) => a.text === 'Első hívás megtörtént.' && a.kind === 'hivas')).toBe(true)
  })

  it('ismeretlen lead → 404', async () => {
    const error = await fetchLead('LEAD-0000-000').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

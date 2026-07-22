import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb, SEED_IDS } from '../../mocks'
import { fetchIncident, fetchIncidents, transitionIncident } from '../incidents'
import { fetchCapas } from '../capa'
import { ApiError } from '../../../../services/apiClient'
import { INCIDENT_FSM, canTransition, transitionBlockReason } from '../fsm'
import { INCIDENT_STATUS_LABELS } from '../../pages/labels'
import { CURRENT_EMPLOYEE_ID } from '../employees'

/** Baleset-FSM: legális lánc + guard (409) utak az MSW kontraktus-tükrön. */

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('INCIDENT_FSM guard táblák (UI + mock közös igazságforrás)', () => {
  it('investigate csak Reported/Reopened állapotból indítható', () => {
    expect(canTransition(INCIDENT_FSM, 'investigate', 'Reported')).toBe(true)
    expect(canTransition(INCIDENT_FSM, 'investigate', 'Reopened')).toBe(true)
    expect(canTransition(INCIDENT_FSM, 'investigate', 'Closed')).toBe(false)
  })

  it('tiltott átmenetre magyar indoklást ad (Button disabledReason)', () => {
    const reason = transitionBlockReason(INCIDENT_FSM, 'close', 'Reported', INCIDENT_STATUS_LABELS)
    expect(reason).toContain('Intézkedés')
    expect(reason).toContain('Bejelentve')
    // engedélyezett átmenet → nincs indok
    expect(
      transitionBlockReason(INCIDENT_FSM, 'investigate', 'Reported', INCIDENT_STATUS_LABELS),
    ).toBeUndefined()
  })
})

describe('esemény FSM-átmenetek az API-n', () => {
  it('végigjárja a teljes legális láncot: Reported → … → Closed → Reopened', async () => {
    const id = SEED_IDS.incReported

    const investigated = await transitionIncident(id, 'investigate', {
      investigatedBy: CURRENT_EMPLOYEE_ID,
    })
    expect(investigated.status).toBe('Investigated')
    expect(investigated.investigatedBy).toBe(CURRENT_EMPLOYEE_ID)

    const planned = await transitionIncident(id, 'addCorrectiveAction', {
      description: 'Targonca-útvonal átjelölése',
      responsiblePerson: CURRENT_EMPLOYEE_ID,
      dueDate: '2026-08-01',
    })
    expect(planned.status).toBe('CorrectiveActionPlanned')
    expect(planned.correctiveActions).toHaveLength(1)

    const closed = await transitionIncident(id, 'close', { closureNotes: 'Kész.' })
    expect(closed.status).toBe('Closed')
    expect(closed.closedAt).toBeTruthy()

    const reopened = await transitionIncident(id, 'reopen', { reopenReason: 'Új tanú jelentkezett.' })
    expect(reopened.status).toBe('Reopened')
  })

  it('az intézkedés az EGYSÉGES CAPA-táblába kerül (unified CAPA)', async () => {
    const id = SEED_IDS.incInvestigated
    await transitionIncident(id, 'addCorrectiveAction', {
      description: 'Polcrendszer megerősítése',
      responsiblePerson: CURRENT_EMPLOYEE_ID,
      dueDate: '2026-08-01',
    })
    const capas = await fetchCapas({ source: 'esemeny', sourceId: id })
    expect(capas.some((c) => c.description === 'Polcrendszer megerősítése')).toBe(true)
  })

  it('tiltott átmenet → 409 Conflict (a backend guard tükre)', async () => {
    const error = await transitionIncident(SEED_IDS.incReported, 'close', { closureNotes: 'x' })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('Érvénytelen FSM-átmenet')
  })

  it('409 után az állapot változatlan marad (state refresh forrása)', async () => {
    await transitionIncident(SEED_IDS.incReported, 'close', { closureNotes: 'x' }).catch(() => {})
    const incident = await fetchIncident(SEED_IDS.incReported)
    expect(incident.status).toBe('Reported')
  })

  it('ismeretlen esemény → 404', async () => {
    const error = await fetchIncident('00000000-0000-4000-8000-00000000dead').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })

  it('a lista státusz-szűrője működik', async () => {
    const reported = await fetchIncidents({ status: 'Reported' })
    expect(reported.items.length).toBeGreaterThan(0)
    expect(reported.items.every((i) => i.status === 'Reported')).toBe(true)
  })
})

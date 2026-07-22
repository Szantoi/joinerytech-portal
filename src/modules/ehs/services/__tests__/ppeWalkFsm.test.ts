import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb, SEED_IDS } from '../../mocks'
import { fetchPpeIssuances, transitionPpeIssuance } from '../ppe'
import { addWalkFinding, fetchSafetyWalk, transitionSafetyWalk } from '../safetyWalks'
import { completeCapa, fetchCapas } from '../capa'
import { ApiError } from '../../../../services/apiClient'
import { CURRENT_EMPLOYEE_ID } from '../employees'

/** EVE-kiadás FSM + bejárás-FSM guardok (409) az MSW kontraktus-tükrön. */

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function issuanceStatus(id: string) {
  const rows = await fetchPpeIssuances()
  return rows.find((i) => i.issuanceId === id)
}

describe('EVE kiadás FSM (Issued → Acknowledged → Returned | Replaced)', () => {
  it('acknowledge: Issued → Acknowledged', async () => {
    await transitionPpeIssuance(SEED_IDS.issIssued, 'acknowledge')
    expect((await issuanceStatus(SEED_IDS.issIssued))?.status).toBe('Acknowledged')
  })

  it('return átvétel előtt → 409 (a kiadás állapota nem változik)', async () => {
    const error = await transitionPpeIssuance(SEED_IDS.issIssued, 'return').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
    expect((await issuanceStatus(SEED_IDS.issIssued))?.status).toBe('Issued')
  })

  it('replace: új kiadást hoz létre és összeköti a régivel', async () => {
    const before = (await fetchPpeIssuances()).length
    await transitionPpeIssuance(SEED_IDS.issAcknowledged, 'replace', {
      replacedBy: CURRENT_EMPLOYEE_ID,
    })
    const rows = await fetchPpeIssuances()
    expect(rows.length).toBe(before + 1)
    const replaced = rows.find((i) => i.issuanceId === SEED_IDS.issAcknowledged)
    expect(replaced?.status).toBe('Replaced')
    expect(replaced?.replacementIssuanceId).toBeTruthy()
    const spawned = rows.find((i) => i.issuanceId === replaced?.replacementIssuanceId)
    expect(spawned?.status).toBe('Issued')
  })

  it('terminális állapotból (Returned) nincs tovább-átmenet → 409', async () => {
    const error = await transitionPpeIssuance(SEED_IDS.issReturned, 'acknowledge').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('a számított isExpired a lejárt, kint lévő eszközön igaz', async () => {
    expect((await issuanceStatus(SEED_IDS.issExpired))?.isExpired).toBe(true)
    expect((await issuanceStatus(SEED_IDS.issAcknowledged))?.isExpired).toBe(false)
  })
})

describe('bejárás FSM (Scheduled → InProgress → ActionRequired → Closed, +Cancelled)', () => {
  it('teljes út: indítás → megállapítás+CAPA → befejezés → CAPA kész → lezárás', async () => {
    const id = SEED_IDS.walkScheduled

    await transitionSafetyWalk(id, 'start')
    expect((await fetchSafetyWalk(id)).status).toBe('InProgress')

    const finding = await addWalkFinding(id, {
      description: 'Hiányzó védőburkolat a gyalugépen.',
      severity: 'Major',
      requiresAction: true,
      capaAssignedTo: CURRENT_EMPLOYEE_ID,
      capaDueDate: '2026-08-01T00:00:00Z',
    })
    expect(finding.correctiveActionId).toBeTruthy()

    // complete: van intézkedést igénylő megállapítás → ActionRequired
    await transitionSafetyWalk(id, 'complete')
    expect((await fetchSafetyWalk(id)).status).toBe('ActionRequired')

    // close guard: nyitott CAPA mellett 409
    const blocked = await transitionSafetyWalk(id, 'close').catch((e: unknown) => e)
    expect((blocked as ApiError).status).toBe(409)
    expect((blocked as ApiError).message).toContain('nyitott intézkedés')

    await completeCapa(finding.correctiveActionId!)
    await transitionSafetyWalk(id, 'close')
    expect((await fetchSafetyWalk(id)).status).toBe('Closed')
  })

  it('megállapítás nem InProgress bejáráshoz → 409', async () => {
    const error = await addWalkFinding(SEED_IDS.walkScheduled, {
      description: 'x', severity: 'Minor', requiresAction: false,
    }).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('complete intézkedést igénylő megállapítás nélkül egyből Closed', async () => {
    // a seedben az InProgress bejárás megállapítása nem igényel intézkedést
    await transitionSafetyWalk(SEED_IDS.walkInProgress, 'complete')
    expect((await fetchSafetyWalk(SEED_IDS.walkInProgress)).status).toBe('Closed')
  })

  it('cancel csak Scheduled állapotból megy → 409 folyamatban lévőre', async () => {
    const error = await transitionSafetyWalk(SEED_IDS.walkInProgress, 'cancel').catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('már teljesített CAPA újra-teljesítése → 409', async () => {
    const error = await completeCapa(SEED_IDS.capaWalkDone).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(409)
  })

  it('az egységes CAPA-tábla mindhárom forrást tartalmazza', async () => {
    const capas = await fetchCapas()
    const sources = new Set(capas.map((c) => c.source))
    expect(sources.has('esemeny')).toBe(true)
    expect(sources.has('bejaras')).toBe(true)
    expect(sources.has('kockazatertekeles')).toBe(true)
  })
})

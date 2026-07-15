import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { ehsApiHandlers, resetEhsDb, SEED_IDS, daysFromNow } from '../../../mocks/ehsApi'
import { computeSdsValidity, isPpeIssuanceExpired } from '../validity'
import { fetchExpiringSds, fetchHazardousMaterial, fetchHazardousMaterials, renewSds } from '../materials'
import { SDS_VALIDITY_META } from '../../../pages/ehs/labels'

/** SDS érvényesség: számítás + API-leképezés + tone-térkép (task 4a). */

const server = setupServer(...ehsApiHandlers)

beforeAll(() => server.listen())
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('computeSdsValidity', () => {
  const now = new Date('2026-07-14T12:00:00Z')

  it('>30 nap → Valid', () => {
    expect(computeSdsValidity('2026-09-14T12:00:00Z', now)).toBe('Valid')
  })

  it('pont 30 nap → Expiring (a határ az ablakhoz tartozik)', () => {
    expect(computeSdsValidity('2026-08-13T12:00:00Z', now)).toBe('Expiring')
  })

  it('≤30 nap → Expiring', () => {
    expect(computeSdsValidity('2026-07-20T12:00:00Z', now)).toBe('Expiring')
  })

  it('múltbeli lejárat → Expired', () => {
    expect(computeSdsValidity('2026-07-13T12:00:00Z', now)).toBe('Expired')
  })
})

describe('SDS validity tone-térkép (StatusPill)', () => {
  it('valid=success, expiring=warn, expired=danger', () => {
    expect(SDS_VALIDITY_META.Valid.tone).toBe('success')
    expect(SDS_VALIDITY_META.Expiring.tone).toBe('warn')
    expect(SDS_VALIDITY_META.Expired.tone).toBe('danger')
  })
})

describe('veszélyesanyag-API számított validitása', () => {
  it('a lista soraiban a seed szerinti validitás jelenik meg', async () => {
    const rows = await fetchHazardousMaterials()
    const byId = new Map(rows.map((r) => [r.materialId, r.sdsValidity]))
    expect(byId.get(SEED_IDS.matValid)).toBe('Valid')
    expect(byId.get(SEED_IDS.matExpiring)).toBe('Expiring')
    expect(byId.get(SEED_IDS.matExpired)).toBe('Expired')
  })

  it('validity szűrő: csak a lejárt anyagok jönnek vissza', async () => {
    const rows = await fetchHazardousMaterials({ validity: 'Expired' })
    expect(rows.map((r) => r.materialId)).toEqual([SEED_IDS.matExpired])
  })

  it('/expiring: lejáró + lejárt aktív anyagok, archivált nélkül', async () => {
    const rows = await fetchExpiringSds()
    const ids = rows.map((r) => r.materialId)
    expect(ids).toContain(SEED_IDS.matExpiring)
    expect(ids).toContain(SEED_IDS.matExpired)
    expect(ids).not.toContain(SEED_IDS.matValid)
    expect(ids).not.toContain(SEED_IDS.matArchived)
  })

  it('renew-sds után a lejárt anyag újra érvényes', async () => {
    await renewSds(SEED_IDS.matExpired, {
      newIssuedAt: daysFromNow(0),
      newExpiresAt: daysFromNow(365),
    })
    const material = await fetchHazardousMaterial(SEED_IDS.matExpired)
    expect(material.sdsValidity).toBe('Valid')
  })
})

describe('isPpeIssuanceExpired (számított EVE lejárat)', () => {
  it('kint lévő, lejárt eszköz → true; visszavett → false', () => {
    const past = daysFromNow(-1)
    expect(isPpeIssuanceExpired(past, 'Acknowledged')).toBe(true)
    expect(isPpeIssuanceExpired(past, 'Issued')).toBe(true)
    expect(isPpeIssuanceExpired(past, 'Returned')).toBe(false)
    expect(isPpeIssuanceExpired(null, 'Acknowledged')).toBe(false)
  })
})

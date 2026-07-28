import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { SEED_IDS, ehsApiHandlers, getEhsDb, resetEhsDb } from '../../mocks'

const server = setupServer(...ehsApiHandlers)
const EVENT_ID = '44444444-4444-4444-8444-444444444444'
const REPORTER_ID = '11111111-1111-4111-8111-111111111111'

function eventBody() {
  return {
    eventId: EVENT_ID,
    type: 'INCIDENT_REPORTED',
    payload: {
      reporterId: REPORTER_ID,
      incidentType: 'injury',
      locationId: SEED_IDS.locWarehouse,
      timestamp: '2026-07-23T08:30:00.000Z',
      description: 'Vágási sérülés a műhelyben',
    },
  }
}

async function postEvent(body: unknown) {
  return fetch('http://localhost:3000/api/ehs/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => resetEhsDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('EHS wizard event ingest', () => {
  it('az első eventet 201-gyel fogadja, a duplikált event ID-t 200-zal idempotensen kezeli', async () => {
    const before = getEhsDb().incidents.length

    const first = await postEvent(eventBody())
    const firstResult = await first.json()
    const duplicate = await postEvent(eventBody())
    const duplicateResult = await duplicate.json()

    expect(first.status).toBe(201)
    expect(duplicate.status).toBe(200)
    expect(firstResult).toMatchObject({ eventId: EVENT_ID, status: 'accepted' })
    expect(duplicateResult).toMatchObject({
      eventId: EVENT_ID,
      sequence: firstResult.sequence,
      status: 'accepted',
      serverTimestamp: firstResult.serverTimestamp,
    })
    expect(getEhsDb().incidents).toHaveLength(before + 1)
    expect(getEhsDb().incidents.find((incident) => incident.incidentId === EVENT_ID))
      .toMatchObject({ reportedBy: REPORTER_ID, incidentType: 'Accident', location: 'Raktár' })
  })

  it.each([
    ['hibás event ID', { ...eventBody(), eventId: 'nem-uuid' }],
    ['üres event ID', { ...eventBody(), eventId: '00000000-0000-0000-0000-000000000000' }],
    ['hibás event type', { ...eventBody(), type: 'OTHER_EVENT' }],
    ['hibás reporter', {
      ...eventBody(),
      payload: { ...eventBody().payload, reporterId: 'nem-uuid' },
    }],
    ['hiányzó helyszín', {
      ...eventBody(),
      payload: { ...eventBody().payload, locationId: null },
    }],
    ['üres helyszín', {
      ...eventBody(),
      payload: { ...eventBody().payload, locationId: '   ' },
    }],
    ['túl hosszú helyszín', {
      ...eventBody(),
      payload: { ...eventBody().payload, locationId: 'x'.repeat(101) },
    }],
    ['hiányzó minimum payload', {
      ...eventBody(),
      payload: { ...eventBody().payload, description: '' },
    }],
    ['túl hosszú leírás', {
      ...eventBody(),
      payload: { ...eventBody().payload, description: 'x'.repeat(2001) },
    }],
    ['túl hosszú fotókulcs', {
      ...eventBody(),
      payload: { ...eventBody().payload, photoS3Key: 'x'.repeat(501) },
    }],
  ])('%s esetén 400-at ad és nem hoz létre incidenst', async (_name, body) => {
    const before = getEhsDb().incidents.length

    const response = await postEvent(body)

    expect(response.status).toBe(400)
    expect(getEhsDb().incidents).toHaveLength(before)
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiFetch, ApiError } from '../apiClient'

/**
 * apiClient hibatest-parse kontraktus-tesztek (M-S3 fix,
 * WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24).
 *
 * A valós backendek háromféle hibatest-alakot adnak:
 *  - openapi ErrorResponse: { message } / { error },
 *  - Ardalis Result.ValidationErrors CSUPASZ tömbként: [{ identifier, errorMessage }]
 *    (cutting planning 400 / executions 422, joinery 400 — kontraktus-doksi 2.1),
 *  - host-változatok: { errors: string[] }, { validationErrors: [...] }.
 * Élő HTTP/2-n a statusText üres — üres toast-üzenet SOHA nem állhat elő.
 */

/**
 * Determinisztikus Response-stub. Szándékosan NEM `new Response(...)`: a
 * globális Response egyes környezetekben a statusText-et reason-phrase-zel
 * tölti ki (a review alatt párhuzamos terhelésnél a fallback-tesztek emiatt
 * egyszer el is buktak) — a stub a teszt által megadott statusText-et adja,
 * mindig, mindenhol ugyanúgy.
 */
function stubFetch(raw: string, init: { status: number; statusText?: string }) {
  const res = {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    statusText: init.statusText ?? '',
    json: async () => JSON.parse(raw) as unknown,
    text: async () => raw,
  } as unknown as Response
  vi.stubGlobal('fetch', vi.fn(async () => res))
}

function mockResponse(body: unknown, init: { status: number; statusText?: string }) {
  stubFetch(body === undefined ? '' : JSON.stringify(body), init)
}

async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError)
    return err as ApiError
  }
  throw new Error('apiFetch nem dobott ApiError-t')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseErrorMessage — hibatest-alakok', () => {
  it('{ message } alak: a backend üzenete megy a toastba', async () => {
    mockResponse({ message: 'A terv nem publikálható.' }, { status: 400 })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('A terv nem publikálható.')
    expect(err.status).toBe(400)
  })

  it('{ error } alak: az error mező a fallback a message hiányában', async () => {
    mockResponse({ error: 'Not allowed' }, { status: 403 })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('Not allowed')
  })

  it('Ardalis ValidationErrors CSUPASZ tömb: az errorMessage-ek join-olva', async () => {
    mockResponse(
      [
        { identifier: 'status', errorMessage: 'Csak Draft rendelés adható be.' },
        { identifier: 'items', errorMessage: 'Legalább egy tétel szükséges.' },
      ],
      { status: 400 },
    )
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('Csak Draft rendelés adható be. Legalább egy tétel szükséges.')
    expect(err.details).toEqual([
      { identifier: 'status', errorMessage: 'Csak Draft rendelés adható be.' },
      { identifier: 'items', errorMessage: 'Legalább egy tétel szükséges.' },
    ])
  })

  it('422 + ValidationErrors tömb (executions Invalid-ág): üzenet nem vész el', async () => {
    mockResponse([{ identifier: 'state', errorMessage: 'Cannot start execution in status Completed' }], {
      status: 422,
    })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('Cannot start execution in status Completed')
    expect(err.status).toBe(422)
  })

  it('{ errors: string[] } host-változat', async () => {
    mockResponse({ errors: ['Hiányzó mező: quantity.', 'Érvénytelen dátum.'] }, { status: 400 })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('Hiányzó mező: quantity. Érvénytelen dátum.')
  })

  it('{ validationErrors: [...] } kulcsolt Ardalis-változat', async () => {
    mockResponse({ validationErrors: [{ errorMessage: 'A mennyiség kötelező.' }] }, { status: 400 })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('A mennyiség kötelező.')
  })

  it('üres statusText (HTTP/2) + ismeretlen test → "HTTP <status>", sosem üres üzenet', async () => {
    mockResponse({ unexpected: true }, { status: 400, statusText: '' })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('HTTP 400')
  })

  it('üres statusText + üres tömb-test → "HTTP <status>"', async () => {
    mockResponse([], { status: 422, statusText: '' })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('HTTP 422')
  })

  it('nem-JSON hibatest → statusText, annak hiányában "HTTP <status>"', async () => {
    stubFetch('<html>oops</html>', { status: 502, statusText: '' })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('HTTP 502')
  })

  it('statusText jelenlétében az a fallback (dev-szerver HTTP/1.1 útvonal)', async () => {
    mockResponse({ unexpected: true }, { status: 400, statusText: 'Bad Request' })
    const err = await expectApiError(apiFetch('/api/x'))
    expect(err.message).toBe('Bad Request')
  })
})

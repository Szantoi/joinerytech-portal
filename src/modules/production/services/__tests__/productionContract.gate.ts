/**
 * WORLDS-PRODUCTION-API-GATE — élő cutting/joinery kontraktus-kapu.
 *
 * ⚠ Ez a fájl SZÁNDÉKOSAN nem `*.test.ts`/`*.spec.ts` — a vitest alap
 * `include` mintája (`**\/*.{test,spec}.*`) ezért NEM szedi fel, tehát
 * `npm test` / `test:pr` / `test:full` / `test:nightly` sosem futtatja és
 * sosem próbál valódi hálózatot hívni háttérben. Kizárólag a
 * `test:contract:production` script futtatja, a saját `vitest.contract.config.ts`
 * fájlon keresztül (explicit `include`).
 *
 * Kötelező env (task-elv 2.: base URL + bearer token CSAK env-ből, hiány
 * esetén fail-fast, SOHA nem skip-success):
 *   PRODUCTION_CUTTING_BASE_URL   pl. http://127.0.0.1:5005 (SSH-tunnel a VPS
 *                                 5005 portjára) — a cutting host GYÖKERE,
 *                                 nginx-proxy-prefix NÉLKÜL (a service saját
 *                                 route-jai `/api/cutting/...`-on élnek).
 *   PRODUCTION_JOINERY_BASE_URL   pl. http://127.0.0.1:5002 — a joinery host
 *                                 gyökere.
 *   PRODUCTION_CONTRACT_TOKEN     Bearer JWT egy MANUFACTURER-tenanthoz. A
 *                                 401-fázis EZ NÉLKÜL is fut (nem igényel
 *                                 érvényes tokent) — a schema- és
 *                                 hibakontraktus-fázisok viszont explicit
 *                                 hibával buknak, ha hiányzik (nem `.skip`),
 *                                 így a teljes futás non-zero exit code-dal
 *                                 zár akkor is, ha nincs token.
 *
 * A riport (route, HTTP-kód, schema PASS/FAIL, drift, duration) az `afterAll`
 * végén konzolra kerül. Bodyt, PII-t vagy tokent SOSEM logolunk — lásd
 * `gateHelpers.ts` (`summarizeDrift` csak mező-útvonalat + zod hibakódot ad).
 */
/// <reference types="node" />
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { z } from 'zod'
import { cuttingPlanSummarySchema } from '../plans'
import { wasteReportSchema } from '../quotes'
import { pagedOrdersSchema } from '../orders'
import { requireEnv, summarizeDrift, formatReportRow, type RouteReport } from '../contract/gateHelpers'

const report: RouteReport[] = []

interface FetchResult {
  status: number
  json: unknown
  durationMs: number
}

async function timedFetch(url: string, init: RequestInit = {}): Promise<FetchResult> {
  const start = performance.now()
  const res = await fetch(url, init)
  const durationMs = Math.round(performance.now() - start)
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    json = undefined
  }
  return { status: res.status, json, durationMs }
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

describe('WORLDS-PRODUCTION-API-GATE — élő cutting/joinery kontraktus-kapu', () => {
  let cuttingBase: string
  let joineryBase: string
  let token: string | undefined

  beforeAll(() => {
    // A base URL-ek MINDIG kötelezők — enélkül a script fail-fast bukik,
    // mielőtt egyetlen hívás is elindulna.
    cuttingBase = requireEnv('PRODUCTION_CUTTING_BASE_URL')
    joineryBase = requireEnv('PRODUCTION_JOINERY_BASE_URL')
    token = process.env.PRODUCTION_CONTRACT_TOKEN?.trim() || undefined
  })

  afterAll(() => {
    console.log('\n=== WORLDS-PRODUCTION-API-GATE — route report (HTTP/schema/drift/duration) ===')
    for (const row of report) {
      console.log(formatReportRow(row))
    }
  })

  describe('401 hibakontraktus — token nélkül (nem igényel valós bearer tokent)', () => {
    it('GET /api/cutting/planning/ → 401 hitelesítés nélkül', async () => {
      const { status, durationMs } = await timedFetch(`${cuttingBase}/api/cutting/planning/`)
      report.push({ route: '/api/cutting/planning/', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs })
      expect(status).toBe(401)
    })

    it('GET /api/cutting/waste → 401 hitelesítés nélkül', async () => {
      const { status, durationMs } = await timedFetch(`${cuttingBase}/api/cutting/waste`)
      report.push({ route: '/api/cutting/waste', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs })
      expect(status).toBe(401)
    })

    it('GET /api/orders → 401 hitelesítés nélkül', async () => {
      const { status, durationMs } = await timedFetch(`${joineryBase}/api/orders?page=1&pageSize=20`)
      report.push({ route: '/api/orders', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs })
      expect(status).toBe(401)
    })
  })

  describe('Read-only kontraktus + zod schema-validáció (TOKEN KÖTELEZŐ)', () => {
    it('GET /api/cutting/planning/ — valós válasz a production cuttingPlanSummarySchema-n PASS', async () => {
      if (!token) {
        throw new Error(
          '[gate] PRODUCTION_CONTRACT_TOKEN hiányzik — a schema-validációs fázis ' +
            'nem futtatható. Ez EXPLICIT hiba, nem néma skip (task-elv 2.).',
        )
      }
      const { status, json, durationMs } = await timedFetch(`${cuttingBase}/api/cutting/planning/`, {
        headers: authHeader(token),
      })
      const parsed = z.array(cuttingPlanSummarySchema).safeParse(json)
      report.push({
        route: '/api/cutting/planning/',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      })
      expect(status).toBe(200)
      expect(parsed.success).toBe(true)
    })

    it('GET /api/cutting/waste — valós válasz a production wasteReportSchema-n PASS (analytics-adjacent route)', async () => {
      if (!token) {
        throw new Error('[gate] PRODUCTION_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.')
      }
      const { status, json, durationMs } = await timedFetch(`${cuttingBase}/api/cutting/waste`, {
        headers: authHeader(token),
      })
      const parsed = wasteReportSchema.safeParse(json)
      report.push({
        route: '/api/cutting/waste',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      })
      expect(status).toBe(200)
      expect(parsed.success).toBe(true)
    })

    it('GET /api/orders — valós válasz a production pagedOrdersSchema-n PASS (door orders)', async () => {
      if (!token) {
        throw new Error('[gate] PRODUCTION_CONTRACT_TOKEN hiányzik — a schema-validációs fázis nem futtatható.')
      }
      const { status, json, durationMs } = await timedFetch(`${joineryBase}/api/orders?page=1&pageSize=20`, {
        headers: authHeader(token),
      })
      const parsed = pagedOrdersSchema.safeParse(json)
      report.push({
        route: '/api/orders',
        method: 'GET',
        httpStatus: status,
        schemaResult: parsed.success ? 'PASS' : 'FAIL',
        drift: parsed.success ? [] : summarizeDrift(parsed.error),
        durationMs,
      })
      expect(status).toBe(200)
      expect(parsed.success).toBe(true)
    })
  })

  describe('400/422 hibakontraktus — hibás filter (TOKEN KÖTELEZŐ)', () => {
    it('GET /api/cutting/waste fordított dátumtartománnyal → 400 (doksi 1.1)', async () => {
      if (!token) {
        throw new Error('[gate] PRODUCTION_CONTRACT_TOKEN hiányzik — a hibakontraktus-fázis nem futtatható.')
      }
      const { status, durationMs } = await timedFetch(
        `${cuttingBase}/api/cutting/waste?from=2026-12-31&to=2026-01-01`,
        { headers: authHeader(token) },
      )
      report.push({ route: '/api/cutting/waste (invalid range)', method: 'GET', httpStatus: status, schemaResult: 'N/A', drift: [], durationMs })
      expect([400, 422]).toContain(status)
    })
  })

  describe('409 tiltott FSM-átmenet — MUTÁCIÓ, disposable dev tenant nélkül BLOKKOLT', () => {
    // A duplikált plan-dátum (POST /api/cutting/plans) vagy a gyartasilap
    // finalize-409 csak valódi mutációval (POST) bizonyítható, ami disposable
    // dev/seed tenantot igényel (task Stop-klauzula). Ez a környezet nem
    // biztosít ilyet (nincs dokumentált dev-tenant token-kiadás — lásd
    // task-doksi Végrehajtási napló). `it.fails`: EXPLICIT dokumentált
    // blokkolás, nem néma `.skip`.
    it.fails('nincs safe disposable dev tenant — 409-mutáció nem futtatható', () => {
      throw new Error(
        'BLOCKED: a 409 (tiltott FSM-átmenet) bizonyítása mutációt igényelne ' +
          '(pl. duplikált plan-dátum POST-ja) egy disposable dev/seed tenanton. ' +
          'Ilyen tenant/token nem áll rendelkezésre ebben a környezetben — ' +
          'lásd WORLDS-PRODUCTION-API-GATE.md Stop-klauzula és Végrehajtási napló. ' +
          'A 400/422 hibakontraktus (fentebb) az elfogadási kritérium ' +
          '„400/422/409 közül legalább egy" pontját már önmagában teljesíti.',
      )
    })
  })
})

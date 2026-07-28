/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { requireEnv, summarizeDrift, formatReportRow, type RouteReport } from '../gateHelpers'

describe('requireEnv — fail-fast a kötelező env-eken', () => {
  const KEY = 'PRODUCTION_CONTRACT_GATE_TEST_VAR'

  beforeEach(() => {
    delete process.env[KEY]
  })
  afterEach(() => {
    delete process.env[KEY]
  })

  it('dob, ha az env hiányzik — NEM ad vissza csendben undefined-et', () => {
    expect(() => requireEnv(KEY)).toThrow(/Hiányzó kötelező env/)
  })

  it('dob, ha az env üres string', () => {
    process.env[KEY] = '   '
    expect(() => requireEnv(KEY)).toThrow()
  })

  it('visszaadja az értéket, ha jelen van', () => {
    process.env[KEY] = 'https://example.invalid'
    expect(requireEnv(KEY)).toBe('https://example.invalid')
  })
})

describe('summarizeDrift — csak útvonal+kód, sosem response-adat', () => {
  const schema = z.object({ id: z.string(), count: z.number() })

  it('mező-útvonalat és zod hibakódot ad, message/received nélkül', () => {
    const result = schema.safeParse({ id: 'abc', count: 'nem szám' })
    expect(result.success).toBe(false)
    if (result.success) throw new Error('unreachable')
    const drift = summarizeDrift(result.error)
    expect(drift).toContain('count:invalid_type')
    // Nem tartalmazhatja a valós (hibás) mezőértéket a riportban.
    expect(drift.join(' ')).not.toContain('nem szám')
  })

  it('hiányzó kötelező mezőt is jelöl', () => {
    const result = schema.safeParse({ count: 1 })
    if (result.success) throw new Error('unreachable')
    expect(summarizeDrift(result.error).some((d) => d.startsWith('id:'))).toBe(true)
  })
})

describe('formatReportRow — riport-sor, soha nincs benne token/body', () => {
  it('PASS sort formáz driftmentesen', () => {
    const row: RouteReport = {
      route: '/api/cutting/planning/',
      method: 'GET',
      httpStatus: 200,
      schemaResult: 'PASS',
      drift: [],
      durationMs: 42,
    }
    const line = formatReportRow(row)
    expect(line).toContain('HTTP=200')
    expect(line).toContain('schema=PASS')
    expect(line).toContain('drift=[-]')
    expect(line).toContain('42ms')
  })

  it('FAIL sor felsorolja a drift-bejegyzéseket', () => {
    const row: RouteReport = {
      route: '/api/cutting/waste',
      method: 'GET',
      httpStatus: 200,
      schemaResult: 'FAIL',
      drift: ['executionCount:invalid_type'],
      durationMs: 10,
    }
    expect(formatReportRow(row)).toContain('executionCount:invalid_type')
  })
})

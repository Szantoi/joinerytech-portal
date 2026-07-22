import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shouldStartMockWorker, enableMocking, type MockWorker } from '../dataMode'

/**
 * WORLDS-PRODUCTION-API-GATE elfogadási kritérium: „api módban az MSW nem
 * indul" — ez a fájl NEM kommentre/manuális ellenőrzésre hagyatkozik, hanem
 * ténylegesen bizonyítja, hogy `enableMocking()` `api` módban egyszer sem
 * hívja meg a worker-betöltőt (tehát a worker.start sem futhat le).
 */
describe('shouldStartMockWorker — dönteni-e MSW-indításról', () => {
  it('production build módban nem indul, dataMode-tól függetlenül', () => {
    expect(shouldStartMockWorker('production', undefined)).toBe(false)
    expect(shouldStartMockWorker('production', 'mock')).toBe(false)
    expect(shouldStartMockWorker('production', 'api')).toBe(false)
  })

  it('dev-default (VITE_DATA_MODE hiányában) MSW-t indítana', () => {
    expect(shouldStartMockWorker('development', undefined)).toBe(true)
  })

  it('explicit mock módban MSW-t indítana', () => {
    expect(shouldStartMockWorker('development', 'mock')).toBe(true)
  })

  it('api módban NEM indítana MSW-t — a kapu lényege', () => {
    expect(shouldStartMockWorker('development', 'api')).toBe(false)
  })
})

describe('enableMocking — a worker-betöltő ténylegesen nem fut le api módban', () => {
  let loadWorker: () => Promise<{ worker: MockWorker }>
  let workerStart: MockWorker['start']

  beforeEach(() => {
    const start = vi.fn<MockWorker['start']>().mockResolvedValue(undefined)
    workerStart = start
    loadWorker = vi.fn<() => Promise<{ worker: MockWorker }>>().mockResolvedValue({ worker: { start } })
  })

  it('api módban a loadWorker-t (és így a worker.start-ot) egyszer sem hívja', async () => {
    await enableMocking({ mode: 'development', dataMode: 'api' }, loadWorker)
    expect(loadWorker).not.toHaveBeenCalled()
    expect(workerStart).not.toHaveBeenCalled()
  })

  it('production módban sem hívja, api módtól függetlenül', async () => {
    await enableMocking({ mode: 'production', dataMode: undefined }, loadWorker)
    expect(loadWorker).not.toHaveBeenCalled()
    expect(workerStart).not.toHaveBeenCalled()
  })

  it('dev-default (mock) módban meghívja a worker.start-ot pontosan egyszer', async () => {
    await enableMocking({ mode: 'development', dataMode: undefined }, loadWorker)
    expect(loadWorker).toHaveBeenCalledTimes(1)
    expect(workerStart).toHaveBeenCalledExactlyOnceWith({ onUnhandledRequest: 'bypass' })
  })

  it('explicit mock módban is meghívja a worker.start-ot', async () => {
    await enableMocking({ mode: 'development', dataMode: 'mock' }, loadWorker)
    expect(workerStart).toHaveBeenCalledTimes(1)
  })
})

/**
 * Adat-mód kapu — MSW indítás/kihagyás döntése (WORLDS-PRODUCTION-API-GATE).
 *
 * A globális MSW worker csak `development` módban ÉS `VITE_DATA_MODE !== 'api'`
 * esetén indul. `api` módban a production (és minden más) modul a valós
 * hosztokat hívja — az MSW-nek EGYÁLTALÁN nem szabad elindulnia, különben
 * `onUnhandledRequest: 'bypass'` mellett is előfordulhatna, hogy egy handler
 * csendben visszaad egy mock-választ éles hívás helyett.
 *
 * A döntési logika (`shouldStartMockWorker`) és a bootstrap (`enableMocking`)
 * ki van vonva a main.tsx-ből, hogy jsdom/hálózat nélkül, közvetlenül
 * tesztelhető legyen — lásd `__tests__/dataMode.test.ts`. Ez az automatikus
 * teszt bizonyítja az elfogadási kritériumot („api módban az MSW nem indul"),
 * nem csak egy komment.
 */

// A visszatérési típus szándékosan `Promise<unknown>` — az igazi MSW
// `worker.start()` böngészőben `Promise<ServiceWorkerRegistration | undefined>`-t
// ad, nekünk csak az érdekes, hogy megvárjuk, az eredményt nem használjuk.
export type MockWorker = { start: (options: { onUnhandledRequest: 'bypass' }) => Promise<unknown> }

export function shouldStartMockWorker(mode: string, dataMode: string | undefined): boolean {
  if (mode !== 'development') return false
  if (dataMode === 'api') return false
  return true
}

export interface EnableMockingEnv {
  mode: string
  dataMode: string | undefined
}

/**
 * `loadWorker` egy külön paraméter (nem közvetlen `import('./browser')` hívás
 * a függvénytörzsben), hogy a teszt a valódi MSW-worker importja/indítása
 * nélkül tudja igazolni: `api` módban a betöltő EGYSZER SEM fut le.
 */
export async function enableMocking(
  env: EnableMockingEnv = { mode: import.meta.env.MODE, dataMode: import.meta.env.VITE_DATA_MODE },
  loadWorker: () => Promise<{ worker: MockWorker }> = () => import('./browser'),
): Promise<void> {
  if (!shouldStartMockWorker(env.mode, env.dataMode)) {
    return
  }
  const { worker } = await loadWorker()
  await worker.start({ onUnhandledRequest: 'bypass' })
}

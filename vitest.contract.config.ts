import { defineConfig } from 'vitest/config'

/**
 * WORLDS-PRODUCTION-API-GATE — külön vitest-konfiguráció a valós
 * cutting/joinery hosztokat hívó kontraktus-kapuhoz.
 *
 * Szándékosan NEM a fő `vite.config.ts` `test` blokkja: az élő hálózati
 * hívásoknak nincs helyük a `npm test`/`test:pr`/`test:full`/`test:nightly`
 * futásokban (azok az MSW-tükrökkel dolgoznak). Az `include` explicit módon
 * KIZÁRÓLAG a gate-fájlra mutat — a fájl neve is szándékosan nem illeszkedik
 * a vitest alap `*.test.ts` mintájára, tehát a fő configgal futtatva sosem
 * kerül elő (dupla védelem az összekeveredés ellen).
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/modules/production/services/__tests__/productionContract.gate.ts'],
    // Egyetlen, valós hálózatot hívó futás — nincs értelme worker-fanoutnak,
    // és a soros futás olvashatóbb riport-sorrendet ad.
    fileParallelism: false,
  },
})

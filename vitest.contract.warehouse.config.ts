import { defineConfig } from 'vitest/config';

/**
 * WORLDS-WAREHOUSE-API-GATE — külön vitest-konfiguráció a valós
 * inventory/procurement hosztokat hívó kontraktus-kapuhoz.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/modules/warehouse/services/__tests__/warehouseContract.gate.ts'],
    fileParallelism: false,
  },
});

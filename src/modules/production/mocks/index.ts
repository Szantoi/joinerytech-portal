import { planHandlers } from './handlers.plans'
import { executionHandlers } from './handlers.executions'
import { orderHandlers } from './handlers.orders'
import { quoteHandlers } from './handlers.quotes'

/**
 * mocks/production — a production világ MSW KONTRAKTUS-TÜKRE (API-first: a
 * séma/útvonal/FSM/hibakód forrása a WORLDS_API_CONTRACTS_2026-07-18.md,
 * NEM előkép). Állapottartó store (db.ts) + a services/production/fsm.ts
 * közös guardjai, a végpontonként DOKUMENTÁLT hibakódokkal:
 * planning 400 · executions 409/422 · joinery 400-tömb · quotes 400.
 */
export const productionApiHandlers = [
  ...planHandlers,
  ...executionHandlers,
  ...orderHandlers,
  ...quoteHandlers,
]

export { getProductionDb, resetProductionDb } from './db'
export { PRODUCTION_SEED_IDS, SEED_WASTE_PER_EXECUTION_CM2, seedDay } from './seed'

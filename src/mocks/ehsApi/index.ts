import { locationHandlers } from './handlers.locations'
import { incidentHandlers } from './handlers.incidents'
import { materialHandlers } from './handlers.materials'
import { ppeHandlers } from './handlers.ppe'
import { walkHandlers } from './handlers.walks'

/**
 * mocks/ehsApi — az EHS backend-kontraktus (src/ehs/docs/openapi.yaml) MSW tükre.
 *
 * Állapottartó in-memory store-ral (./db.ts) fut: a mutációk perzisztálnak a
 * munkameneten belül, a tiltott FSM-átmenetekre a backenddel egyezően 409-et ad
 * (guardok: services/ehs/fsm.ts — EGY igazságforrás a UI-jal).
 * Tesztben: `setupServer(...ehsApiHandlers)` + `resetEhsDb()` beforeEach-ben.
 */
export const ehsApiHandlers = [
  ...locationHandlers,
  ...incidentHandlers,
  ...materialHandlers,
  ...ppeHandlers,
  ...walkHandlers,
]

export { resetEhsDb, getEhsDb } from './db'
export { SEED_IDS, daysFromNow } from './seed'

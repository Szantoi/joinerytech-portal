import { leadHandlers } from './handlers.leads'
import { oppHandlers } from './handlers.opps'
import { taskHandlers } from './handlers.tasks'

/**
 * mocks/crmApi — a CRM modul MSW-FIRST kontraktusa (az ehsApi mintája).
 *
 * A backend CRM modulnak nincs futtatható hostja/OpenAPI-ja (audit blocker
 * G0.1), ezért a kontraktust EZ a tükör rögzíti a terv-FSM-ek szerint.
 * Állapottartó in-memory store-ral (./db.ts) fut; a tiltott FSM-átmenetekre
 * 409-et ad (guardok: services/crm/fsm.ts — EGY igazságforrás a UI-jal).
 * Tesztben: `setupServer(...crmApiHandlers)` + `resetCrmDb()` beforeEach-ben.
 */
export const crmApiHandlers = [
  ...leadHandlers,
  ...oppHandlers,
  ...taskHandlers,
]

export { resetCrmDb, getCrmDb } from './db'
export { CRM_SEED_IDS, dueInDays } from './seed'

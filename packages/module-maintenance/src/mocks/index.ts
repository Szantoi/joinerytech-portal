import { assetHandlers } from './handlers.assets'
import { workOrderHandlers } from './handlers.workOrders'

/**
 * mocks/maintenanceApi — a Maintenance modul MSW kontraktus-tükre (MSW-first:
 * a backend src/maintenance domainje + endpoint-váza kész, de a munkalap-FSM
 * végpontjai hiányosak és 204-et adnak). Állapottartó store (db.ts) + a
 * services/maintenance/fsm.ts guardjaival egyező 409-válaszok; az eszköz-
 * státusz kiszolgáláskor SZÁMÍTOTT (services/maintenance/calc).
 */
export const maintenanceApiHandlers = [
  ...assetHandlers,
  ...workOrderHandlers,
]

export { getMaintenanceDb, resetMaintenanceDb } from './db'
export { MNT_SEED_IDS, MOCK_TECHNICIAN, seedDay } from './seed'

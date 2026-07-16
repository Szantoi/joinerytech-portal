import { employeeHandlers } from './handlers.employees'
import { absenceHandlers } from './handlers.absences'
import { capacityHandlers } from './handlers.capacity'
import { timeLogHandlers } from './handlers.timelogs'

/**
 * mocks/hrApi — a HR modul MSW kontraktus-tükre (MSW-first: a backend HR
 * domainje kész, de nincs API-hostja — audit G4.1). Állapottartó store
 * (db.ts) + a services/hr/fsm.ts guardjaival egyező 409-válaszok.
 */
export const hrApiHandlers = [
  ...employeeHandlers,
  ...absenceHandlers,
  ...capacityHandlers,
  ...timeLogHandlers,
]

export { getHrDb, resetHrDb } from './db'
export { HR_SEED_IDS, seedAnchor, seedWorkday } from './seed'

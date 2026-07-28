import { inspectionHandlers } from './handlers.inspections'
import { ticketHandlers } from './handlers.tickets'

/**
 * mocks/qaApi — a QA modul MSW kontraktus-tükre (MSW-first: a backend src/qa
 * domainje teljes, de az Inspection végpontok 204-et adnak, a Ticketnek pedig
 * nincs REST végpontja). Állapottartó store (db.ts) + a services/qa/fsm.ts
 * guardjaival egyező 409-válaszok; a `blocking`/`openTickets` mezők
 * kiszolgáláskor SZÁMÍTOTTAK (services/qa/calc).
 */
export const qaApiHandlers = [
  ...inspectionHandlers,
  ...ticketHandlers,
]

export { getQaDb, resetQaDb } from './db'
export { QA_SEED_IDS, MOCK_INSPECTOR, MOCK_REPORTER, seedDay } from './seed'

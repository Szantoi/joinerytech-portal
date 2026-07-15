import { documentHandlers } from './handlers.documents'

/**
 * mocks/dmsApi — a DMS modul MSW kontraktus-tükre (MSW-first: a backend
 * src/dms Document-magja domain-modell + OpenAPI, futtatható endpoint-réteg
 * nélkül). Állapottartó store (db.ts) + a services/dms/fsm.ts guardjaival
 * egyező 409-válaszok; a `releasedVersion`/`expiry` mezők kiszolgáláskor
 * SZÁMÍTOTTAK (services/dms/calc). Verzió-lánc: POST /:id/versions =
 * léptetés + megőrzés (AddVersion-tükör).
 */
export const dmsApiHandlers = [
  ...documentHandlers,
]

export { getDmsDb, resetDmsDb } from './db'
export { DMS_SEED_IDS, MOCK_UPLOADER, seedDay } from './seed'

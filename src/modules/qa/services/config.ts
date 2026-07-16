/**
 * QA szolgáltatás-konfiguráció — minden „állítható" érték itt él
 * (QUALITY.md 3.: nincs hardcodolt adat a képernyőkben/számításokban;
 * HR-review M1-lecke: a küszöb SOHA nem literál a UI-ban).
 */

/**
 * A QA modul API gyökere. A backend (src/qa) domainje teljes (Inspection +
 * Ticket + QACheckpoint aggregátum, FSM-ekkel), de az endpoint-réteg részleges:
 * az Inspection végpontok léteznek (`/api/qa/inspections` — 204-es válaszokkal),
 * a Ticketnek viszont EGYETLEN REST végpontja sincs — a hibajegy-kontraktus
 * MSW-FIRST előkép (src/mocks/qaApi), a backend Command-nevek tükrében.
 */
export const QA_API_BASE = '/api/qa'

/** A megfelelési arány (pass rate) figyelmeztetési küszöbe (%) — dashboard KPI. */
export const PASS_RATE_WARN_THRESHOLD = 90

/** A trend-nézet ablaka: hány naptári hét látszik visszamenőleg. */
export const TREND_WINDOW_WEEKS = 6

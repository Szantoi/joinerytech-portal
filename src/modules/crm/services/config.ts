/**
 * CRM szolgáltatás-konfiguráció — minden „állítható" érték itt él (QUALITY.md 3.).
 */

/**
 * A CRM modul API gyökere. A backend CRM modulnak még nincs futtatható
 * hostja/OpenAPI-ja (audit blocker G0.1) — a kontraktus MSW-FIRST definiált
 * (src/mocks/crmApi), a terv-FSM-ek szerint (UI_IMPLEMENTATION_PLAN 5. pont).
 */
export const CRM_API_BASE = '/api/crm'

/**
 * Feladat-SLA figyelmeztetési ablak napokban: a határidőig ennyi (vagy kevesebb)
 * nap → „hamarosan" (soon) jelzés; lejárt határidő → „késésben" (overdue).
 */
export const TASK_SLA_SOON_DAYS = 2

/** Az áttekintés „legutóbbi tevékenységek" listájának hossza. */
export const RECENT_ACTIVITY_LIMIT = 8

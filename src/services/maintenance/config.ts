/**
 * Maintenance szolgáltatás-konfiguráció — minden „állítható" érték itt él
 * (QUALITY.md 3.: nincs hardcodolt adat a képernyőkben/számításokban).
 */

/**
 * A Maintenance modul API gyökere. A backend (src/maintenance) domainje ÉS
 * endpoint-váza kész (`/api/maintenance/assets` + `/api/maintenance/work-orders`),
 * de a munkalap-FSM átmenetei közül csak a start/complete van kivezetve —
 * a schedule/assign/postpone/reject/reopen végpontok MSW-FIRST előképek
 * (src/mocks/maintenanceApi), a backend Command-nevek tükrében.
 */
export const MAINTENANCE_API_BASE = '/api/maintenance'

/** Ennyi napon belül esedékes megelőző terv számít „hamarosan esedékesnek" (idokoz-trigger). */
export const PLAN_DUE_SOON_DAYS = 7

/** Ennyi üzemórán belül esedékes terv számít „hamarosan esedékesnek" (uzemora-trigger). */
export const PLAN_DUE_SOON_HOURS = 50

/** A karbantartási ütemterv-rács ablaka (naptári nap, a mai naptól). */
export const SCHEDULE_WINDOW_DAYS = 14

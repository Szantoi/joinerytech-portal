/**
 * Kontrolling szolgáltatás-konfiguráció — minden „állítható" érték itt él (QUALITY.md 3.).
 */

/**
 * A Kontrolling modul API gyökere. A backend
 * (src/spaceos-modules/spaceos-modules-kontrolling) KÉSZ — EAC, variance,
 * cost-adjustment, overhead —, de nincs host-ba kötve (audit blocker G0.1/G3.2),
 * ezért a kontraktus MSW-FIRST tükrözi a backend `/api/kontrolling` felületét
 * (src/mocks/controllingApi).
 */
export const CONTROLLING_API_BASE = '/api/kontrolling'

/** Fedezet-sávhatárok: ez alatt „gyenge" (és kockázatos projekt), e felett „jó". */
export const MARGIN_WEAK_THRESHOLD = 0.15
export const MARGIN_GOOD_THRESHOLD = 0.3

/**
 * Kockázatos projekt: nem lezárt/vázlat státuszú ÉS az EAC-fedezete a
 * MARGIN_WEAK_THRESHOLD alá esik (vezetői áttekintés KPI).
 */
export const AT_RISK_MARGIN_THRESHOLD = MARGIN_WEAK_THRESHOLD

/** A fedezet-trend diagram hossza hónapban (vezetői áttekintés). */
export const MARGIN_TREND_MONTHS = 6

/**
 * ÁTMENETI: a bejelentkezett kontroller neve a korrekciók audit-mezőjéhez —
 * a valós user-context (Keycloak profil) bekötéséig (az EHS
 * CURRENT_EMPLOYEE_ID mintája).
 */
export const CONTROLLING_CURRENT_USER = 'Kovács P.'

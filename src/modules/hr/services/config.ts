/**
 * HR szolgáltatás-konfiguráció — minden „állítható" érték itt él (QUALITY.md 3.).
 */

/**
 * A HR modul API gyökere. A backend HR modul domainje KÉSZ és terv-konform
 * (src/hr — Absence FSM + guardok), de nincs API-rétege/hostja (audit G4.1),
 * ezért a kontraktus MSW-FIRST definiált (src/mocks/hrApi), a backend domain
 * elnevezéseit tükrözve (approve/reject/start/complete/reopen).
 */
export const HR_API_BASE = '/api/hr'

/** Munkanapok száma hetente — a napi kapacitás = heti óraszám / ennyi. */
export const WORKDAYS_PER_WEEK = 5

/** Lebegőpontos tűrés a túlterhelés-jelzéshez (8.0 ó lekötés 8 ó kapacitáson nem túlterhelés). */
export const OVERLOAD_EPSILON = 0.01

/** E kihasználtság felett a nap/hét „magas terhelés" (warn) jelzést kap. */
export const UTILIZATION_WARN_THRESHOLD = 0.85

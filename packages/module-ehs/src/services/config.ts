/**
 * EHS szolgáltatás-konfiguráció — minden „állítható" érték itt él (QUALITY.md 3.).
 */

/** Az EHS modul API gyökere (openapi.yaml servers + kernel routing). */
export const EHS_API_BASE = '/api/ehs'

/** SDS/EVE lejárat-figyelési ablak napokban (backend default: 30). */
export const EXPIRY_WINDOW_DAYS = 30

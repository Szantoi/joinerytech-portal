/**
 * DMS szolgáltatás-konfiguráció — minden „állítható" érték itt él
 * (QUALITY.md 3.: nincs hardcodolt adat a képernyőkben/számításokban;
 * HR-review M1-lecke: a küszöb SOHA nem literál a UI-ban).
 */

/**
 * A DMS modul API gyökere. A backend (src/dms) Document-magja domain-modell +
 * OpenAPI-kontraktus (src/dms/docs/openapi.yaml, base: /api/dms) — futtatható
 * endpoint-rétege NINCS (csak a DocumentCategory/Tag szelet handler-kész,
 * host nélkül). A dokumentum-kontraktus ezért MSW-FIRST előkép
 * (src/mocks/dmsApi), a prototípus (docs/joinerytech/data-docs.js) tükrében.
 */
export const DMS_API_BASE = '/api/dms'

/**
 * Lejárat-figyelés ablaka (nap): a `validUntil` ezen belül → „hamarosan lejár"
 * (felülvizsgálandó). A backend IDocumentExpiryService / GET /search/expiring
 * paraméterének kliens-oldali előképe.
 */
export const EXPIRY_WARN_DAYS = 30

/** A dashboard „Legutóbbi dokumentumok" listájának hossza. */
export const RECENT_DOCS_LIMIT = 5

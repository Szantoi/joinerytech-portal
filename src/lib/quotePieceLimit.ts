/**
 * Public quote-request tétel-limit — tiszta, DOM-mentes üzleti szabály.
 *
 * Kiemelve a `PublicQuoteRequestPage`-ből (STAB-FE-TEST-GATE), hogy az 50
 * tételes határ a 49/50/51 eseteivel egy gyors unit-teszttel, render nélkül
 * lefedhető legyen — a komponens csak ezt a függvényt hívja, és az
 * affordanciát (disabled gomb + indok) jeleníti meg.
 */

export const MAX_QUOTE_PIECES = 50

export interface PieceLimitCheck {
  /** Hozzáadható-e még egy tétel a jelenlegi darabszám mellett. */
  allowed: boolean
  /** Felhasználónak mutatott indok, ha nem adható hozzá; egyébként null. */
  reason: string | null
}

/**
 * Megmondja, hozzáadható-e egy újabb tétel egy public quote-request
 * űrlaphoz, adott jelenlegi tételszám és (opcionális) maximum mellett.
 *
 * @param currentPieceCount az űrlapon jelenleg szereplő tételek száma
 * @param maxPieces engedélyezett maximum (alapértelmezett: {@link MAX_QUOTE_PIECES})
 */
export function checkQuotePieceLimit(
  currentPieceCount: number,
  maxPieces: number = MAX_QUOTE_PIECES
): PieceLimitCheck {
  if (currentPieceCount >= maxPieces) {
    return { allowed: false, reason: `Maximum ${maxPieces} pieces per quote request` }
  }
  return { allowed: true, reason: null }
}

import { describe, it, expect } from 'vitest'
import { checkQuotePieceLimit, MAX_QUOTE_PIECES } from '../quotePieceLimit'

/**
 * quotePieceLimit unit tesztek — DOM/render nélkül, tiszta függvényhívások.
 * Ez váltja ki a korábbi, PublicQuoteRequestPage-et 49x újrarenderelő
 * suite-tesztet (STAB-FE-TEST-GATE): a 49/50/51 határeset és a pontos
 * hibaszöveg itt van kimerítően lefedve.
 */
describe('checkQuotePieceLimit', () => {
  it('49 meglévő tételnél még engedélyezett a hozzáadás (50. tétel felvehető)', () => {
    const result = checkQuotePieceLimit(49)
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('50 meglévő tételnél a limit blokkol', () => {
    const result = checkQuotePieceLimit(50)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Maximum 50 pieces per quote request')
  })

  it('51 meglévő tételnél (limit fölött) továbbra is blokkol', () => {
    const result = checkQuotePieceLimit(51)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Maximum 50 pieces per quote request')
  })

  it('a hibaszöveg pontosan egyezik a felhasználónak mutatott szöveggel', () => {
    const result = checkQuotePieceLimit(MAX_QUOTE_PIECES)
    expect(result.reason).toBe('Maximum 50 pieces per quote request')
  })

  it('0 tételnél engedélyezett (üres űrlap)', () => {
    expect(checkQuotePieceLimit(0).allowed).toBe(true)
  })

  it('egyedi maxPieces paraméterrel is helyesen számol', () => {
    expect(checkQuotePieceLimit(4, 5).allowed).toBe(true)
    expect(checkQuotePieceLimit(5, 5).allowed).toBe(false)
    expect(checkQuotePieceLimit(5, 5).reason).toBe('Maximum 5 pieces per quote request')
  })
})

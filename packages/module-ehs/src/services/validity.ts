import { EXPIRY_WINDOW_DAYS } from './config'

/**
 * SDS érvényesség — SZÁMÍTOTT mező, a backend logika tükörképe (openapi SdsValidity):
 *   Valid: >30 nap a lejáratig · Expiring: ≤30 nap · Expired: lejárt.
 * Az MSW mock és a tesztek is ezt a függvényt használják.
 */

export type SdsValidity = 'Valid' | 'Expiring' | 'Expired'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function computeSdsValidity(
  expiresAt: string | Date,
  now: Date = new Date(),
  windowDays: number = EXPIRY_WINDOW_DAYS,
): SdsValidity {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const remainingDays = (expiry.getTime() - now.getTime()) / MS_PER_DAY
  if (remainingDays < 0) return 'Expired'
  if (remainingDays <= windowDays) return 'Expiring'
  return 'Valid'
}

/**
 * EVE kiadás lejárt-e — SZÁMÍTOTT (openapi PpeIssuanceDto.isExpired):
 * a lejárat elmúlt, miközben az eszköz még kint van (Issued/Acknowledged).
 */
export function isPpeIssuanceExpired(
  expiresAt: string | null | undefined,
  status: string,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false
  const outstanding = status === 'Issued' || status === 'Acknowledged'
  return outstanding && new Date(expiresAt).getTime() < now.getTime()
}

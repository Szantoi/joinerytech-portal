import { ApiError } from '../../../services/apiClient'

/**
 * Warehouse hiba-megjelenítés — a képernyő-hibaágak KÖZÖS státuszkód-térképe
 * (ApiError.status / isConflict). A backend hibakódjai:
 *  - 400/422: validáció (hibás payload / lapozás / nem-UUID jobId),
 *  - 404: ismeretlen erőforrás (offcut / PO / anyag),
 *  - 409: FSM-guard / üzleti szabály (Result.Conflict → ResultToHttp),
 *  - 410: lejárt offcut-foglalás (OffcutEndpoints ApproveReservation).
 */
export function warehouseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 410) {
      return 'A foglalás lejárt (410) — indíts új foglalást.'
    }
    if (error.status === 409) {
      return `Tiltott átmenet / ütközés (409): ${error.message}`
    }
    if (error.status === 404) {
      return `Az erőforrás nem található (404): ${error.message}`
    }
    if (error.status === 400 || error.status === 422) {
      return `Érvénytelen kérés (${error.status}): ${error.message}`
    }
    return `${fallback} (HTTP ${error.status}: ${error.message})`
  }
  if (error instanceof Error && error.message) {
    return `${fallback}: ${error.message}`
  }
  return fallback
}

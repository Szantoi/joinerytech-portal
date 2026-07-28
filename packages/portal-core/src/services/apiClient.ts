import type { ZodType } from 'zod'

/**
 * apiClient — generikus, zod-validált fetch réteg (F2 adatréteg-minta).
 *
 * Minden modul-szolgáltatás (services/ehs, később crm/hr/...) ezen keresztül
 * beszél a backenddel (dev-ben az MSW-vel). Felelősségei:
 *  - query-string építés (undefined paraméterek kihagyása),
 *  - JSON body szerializálás,
 *  - hiba-normalizálás: nem-2xx → ApiError (status + backend ErrorResponse.message),
 *  - válasz-validálás zod sémával (a kontraktus-eltérés fejlesztéskor azonnal kiderül).
 */

/** A backend ErrorResponse alakja (openapi.yaml components/schemas/ErrorResponse). */
interface BackendError {
  error?: string
  message?: string
  details?: unknown
  /** ASP.NET / cutting host változat: hibaüzenet-lista. */
  errors?: unknown
  /** Ardalis Result változat kulcs alatt (némely végpont így csomagolja). */
  validationErrors?: unknown
}

/** Ardalis `Result.ValidationErrors` elem-alak: `[{ identifier, errorMessage }]`. */
interface ValidationErrorItem {
  identifier?: string
  errorMessage?: string
}

/** Hibaüzenetek kinyerése tömb-alakú hibatestből (string[] VAGY ValidationErrorItem[]). */
function messagesFromArray(items: unknown[]): string[] {
  return items
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const v = item as ValidationErrorItem
        if (typeof v.errorMessage === 'string' && v.errorMessage) return v.errorMessage
      }
      return undefined
    })
    .filter((m): m is string => Boolean(m))
}

export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/** 409 — FSM guard / üzleti szabály megsértése (a UI toast-tal jelzi). */
export function isConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409
}

export type QueryParams = Record<string, string | number | boolean | undefined>

export interface ApiRequest<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: QueryParams
  body?: unknown
  /** Zod séma a válaszhoz — ha megadott, a válasz parse-olva (validálva) tér vissza. */
  schema?: ZodType<T>
}

function buildQueryString(query?: QueryParams): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Hiba-normalizálás. Ismert hibatest-alakok (M-S3 fix,
 * WORLDS_PRODUCTION_DESIGN_REVIEW_2026-07-24):
 *  - `{ message }` / `{ error }` — openapi ErrorResponse (EHS-minta),
 *  - `[{ identifier, errorMessage }]` — Ardalis Result.ValidationErrors CSUPASZ
 *    tömbként (cutting planning 400 / executions 422, joinery 400),
 *  - `{ errors: string[] }` és `{ validationErrors: [...] }` — host-változatok.
 * Élő HTTP/2-n a `statusText` üres string, ezért a fallback minden ágon
 * `statusText || 'HTTP <status>'` — üres toast-üzenet nem fordulhat elő.
 */
async function parseErrorMessage(res: Response): Promise<{ message: string; details?: unknown }> {
  const fallback = res.statusText || `HTTP ${res.status}`
  try {
    const data: unknown = await res.json()

    if (Array.isArray(data)) {
      const messages = messagesFromArray(data)
      return { message: messages.length > 0 ? messages.join(' ') : fallback, details: data }
    }

    if (data && typeof data === 'object') {
      const body = data as BackendError
      if (typeof body.message === 'string' && body.message) {
        return { message: body.message, details: body.details }
      }
      if (typeof body.error === 'string' && body.error) {
        return { message: body.error, details: body.details }
      }
      const listed = Array.isArray(body.errors)
        ? messagesFromArray(body.errors)
        : Array.isArray(body.validationErrors)
          ? messagesFromArray(body.validationErrors)
          : []
      if (listed.length > 0) {
        return { message: listed.join(' '), details: body.details ?? data }
      }
      // Ismeretlen objektum-alak: a details kontraktus megmarad (régi viselkedés).
      return { message: fallback, details: body.details }
    }

    return { message: fallback }
  } catch {
    return { message: fallback }
  }
}

/**
 * Tipizált fetch. `schema` nélkül T=void (pl. 204-es transition végpontok).
 * Nem-2xx válasz → ApiError (a TanStack Query onError ágába kerül).
 */
export async function apiFetch<T = void>(path: string, options: ApiRequest<T> = {}): Promise<T> {
  const { method = 'GET', query, body, schema } = options

  const res = await fetch(`${path}${buildQueryString(query)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const { message, details } = await parseErrorMessage(res)
    throw new ApiError(message, res.status, details)
  }

  // 204 No Content / üres törzs → nincs mit parse-olni
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (text === '') return undefined as T

  const json: unknown = JSON.parse(text)
  return schema ? schema.parse(json) : (json as T)
}

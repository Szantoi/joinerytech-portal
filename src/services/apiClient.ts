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

async function parseErrorMessage(res: Response): Promise<{ message: string; details?: unknown }> {
  try {
    const data = (await res.json()) as BackendError
    return { message: data.message ?? data.error ?? res.statusText, details: data.details }
  } catch {
    return { message: res.statusText || `HTTP ${res.status}` }
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

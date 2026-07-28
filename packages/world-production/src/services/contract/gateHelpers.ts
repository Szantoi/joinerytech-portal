/// <reference types="node" />
import type { z } from 'zod'

/**
 * WORLDS-PRODUCTION-API-GATE — segédfüggvények az élő kontraktus-kapuhoz
 * (`__tests__/productionContract.gate.ts`, futtatás: `npm run
 * test:contract:production`). Ezek a függvények TISZTÁK (nincs hálózat,
 * nincs `import.meta.env`) — ezért közönséges vitest-tesztben, a normál
 * szvit részeként is lefutnak (`gateHelpers.test.ts`), a hálózatot ténylegesen
 * érintő kapu-fájl viszont szándékosan NEM (lásd ott a fejléc-kommentet).
 */

/**
 * Kötelező env-olvasás — hiány esetén AZONNAL dob, világos üzenettel.
 * A gate task-elve (2. pont): a base URL és a bearer token csak env-ből
 * jöhet, hiány esetén fail-fast, SOHA nem csendes skip-success.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[production-contract-gate] Hiányzó kötelező env: ${name}. ` +
        'A base URL-ek és a bearer token csak env-ből jöhetnek — a script ' +
        'fail-fast (nem skip-success), lásd WORLDS-PRODUCTION-API-GATE.md.',
    )
  }
  return value
}

/**
 * Contract-drift összegzés zod hibából — CSAK mező-útvonal + hibakód kerül a
 * riportba, a `message`/`received` mezőket szándékosan kihagyjuk (azok
 * tartalmazhatnak valós response-adatot — a task-elv 6. pontja tiltja a
 * body/PII naplózását).
 */
export function summarizeDrift(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}:${issue.code}`)
}

export interface RouteReport {
  route: string
  method: string
  httpStatus: number | 'ERROR'
  /** 'N/A' = ez a hívás nem sémán validált (pl. tiszta hibakontraktus-teszt). */
  schemaResult: 'PASS' | 'FAIL' | 'N/A'
  drift: string[]
  durationMs: number
}

/** Egysoros, ember-olvasható riport-sor — sosem tartalmaz bodyt/tokent. */
export function formatReportRow(r: RouteReport): string {
  const drift = r.drift.length > 0 ? r.drift.join('; ') : '-'
  return (
    `${r.method.padEnd(6)} ${r.route.padEnd(46)} ` +
    `HTTP=${String(r.httpStatus).padEnd(5)} schema=${r.schemaResult.padEnd(4)} ` +
    `drift=[${drift}] ${r.durationMs}ms`
  )
}

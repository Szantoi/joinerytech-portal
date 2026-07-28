/// <reference types="node" />
import type { z } from 'zod';

/**
 * WORLDS-WAREHOUSE-API-GATE — segédfüggvények az élő kontraktus-kapuhoz
 * (`__tests__/warehouseContract.gate.ts`, futtatás: `npm run test:contract:warehouse`).
 */

/**
 * Kötelező env-olvasás — hiány esetén AZONNAL dob.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `[warehouse-contract-gate] Hiányzó kötelező env: ${name}. ` +
        'A base URL-ek és a bearer token csak env-ből jöhetnek — a script ' +
        'fail-fast (nem skip-success), lásd WORLDS-WAREHOUSE-API-GATE.md.',
    );
  }
  return value;
}

/**
 * Contract-drift összegzés zod hibából — CSAK mező-útvonal + hibakód kerül a riportba.
 */
export function summarizeDrift(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}:${issue.code}`);
}

export interface RouteReport {
  route: string;
  method: string;
  httpStatus: number | 'ERROR';
  schemaResult: 'PASS' | 'FAIL' | 'N/A';
  drift: string[];
  durationMs: number;
}

/** Egysoros, ember-olvasható riport-sor. */
export function formatReportRow(r: RouteReport): string {
  const drift = r.drift.length > 0 ? r.drift.join('; ') : '-';
  return (
    `${r.method.padEnd(6)} ${r.route.padEnd(46)} ` +
    `HTTP=${String(r.httpStatus).padEnd(5)} schema=${r.schemaResult.padEnd(4)} ` +
    `drift=[${drift}] ${r.durationMs}ms`
  );
}

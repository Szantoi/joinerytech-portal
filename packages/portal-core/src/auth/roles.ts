/**
 * A portál szerep-szótára — EGY forrás (PLAN-05 F6).
 *
 * Miért allowlist: a realm bármit küldhet (`offline_access`, `uma_authorization`,
 * bérlő-specifikus szerepek); ha mindet beengednénk, a jogosultsági döntések
 * olyan nevekre épülnének, amiket a portál nem ismer. Ismeretlen szerep tehát
 * kiesik — de a listát bővíteni kell, ha új szerep valódi jogot kap.
 *
 * A lista bővítése 2026-07-29-én vált szükségessé: a `useSchedulePermissions`
 * `machine_operator`/`production_manager` szerepre volt írva, a szűrő viszont
 * kiejtette őket — így az ütemezés-képernyő MINDENKINEK csak-olvasható volt.
 * A hiba addig rejtve maradt, amíg a képernyő nem volt beroutolva.
 */

/** Portál-szerepek (adminisztratív + üzemi). Ismeretlen szerep nem jut be. */
export const PORTAL_ROLES = [
  'Admin',
  'Designer',
  'Joiner',
  'production_manager',
  'machine_operator',
] as const

export type PortalRole = (typeof PORTAL_ROLES)[number]

export function isPortalRole(value: string): value is PortalRole {
  return (PORTAL_ROLES as readonly string[]).includes(value)
}

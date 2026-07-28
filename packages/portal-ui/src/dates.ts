/**
 * Naptár-helyerek a nézet-rétegnek — locale-tudatosan, Intl-lel.
 *
 * Provenance: a doorstar-instance `lib/dates.ts`-éből általánosítva (PLAN-05 F3).
 * A kézzel írt `DAY_NAMES` tömb helyére `Intl.DateTimeFormat` lépett, a
 * `weekLabel` magyar sorrendje pedig `Intl.DateTimeFormat.formatRange`-re —
 * így a nap- és hónapnevek a hívó locale-ját követik.
 *
 * Minden lépés **naptári** (a `Date` setter-ein keresztül), nem ezredmásodperc-
 * összeadással: a nyári időszámítás váltásakor egy „nap" nem 24 óra, és az
 * ms-aritmetika ilyenkor átcsúszik a szomszédos napra.
 */

/** Helyi idejű `YYYY-MM-DD` (nem UTC — a `toISOString` zóna-eltolást okozna). */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Helyi éjfél — az összehasonlítások közös alapja. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Naptári nap-léptetés (DST-biztos). Negatív érték visszafelé lép. */
export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * A hetet kezdő nap éjfele. `weekStartsOn`: 0 = vasárnap … 1 = hétfő (alap,
 * ISO-8601 és a magyar konvenció).
 */
export function startOfWeek(date: Date, weekStartsOn = 1): Date {
  const start = startOfDay(date)
  const diff = (start.getDay() - weekStartsOn + 7) % 7
  start.setDate(start.getDate() - diff)
  return start
}

/** Ugyanaz a nap-e (helyi naptár szerint). */
export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

/** `YYYY-MM-DD` → helyi éjfél; érvénytelen bemenetre `undefined`. */
export function parseIsoDate(value: string): Date | undefined {
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : undefined
}

/** Nap neve a locale szerint (a kézzel írt DAY_NAMES helyett). */
export function formatDayName(date: Date, locale?: string, weekday: 'short' | 'long' | 'narrow' = 'short'): string {
  return new Intl.DateTimeFormat(locale, { weekday }).format(date)
}

/** Tartomány-felirat (pl. „2026. aug. 3. – 9."); az Intl vonja össze az ismétlődő részeket. */
export function formatDateRange(from: Date, to: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).formatRange(from, to)
}

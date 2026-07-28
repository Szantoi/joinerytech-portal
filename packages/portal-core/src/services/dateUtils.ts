/**
 * dateUtils — közös, HELYI idejű nap-szintű dátum-helperek a YYYY-MM-DD
 * (esetleg THH:mm farokkal érkező) ISO nap-kulcsokhoz.
 *
 * A services/{hr,maintenance,qa,dms}/calc.ts azonos példányaiból kiemelve
 * (F2-MAINTENANCE-FE 6. / F2-QA-FE 8. follow-up, a fsmGuards-kiemelés
 * mintájára); a modul-calc-ok innen RE-EXPORTÁLJÁK, így a modul-API változatlan.
 *
 * NE `new Date(iso)`: az a dátum-only stringet UTC-éjfélként értelmezi —
 * UTC-től nyugatra a nap-bontás (rács-fejléc, hétvége-satírozás, formázott
 * dátum) egy nappal elcsúszna (Maintenance-review M1 lecke, UTC-csapda).
 */

export const DAY_MS = 86_400_000

/** Nap-kulcs → helyi idejű éjfél (az esetleges THH:mm farok levágva). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date → helyi idejű YYYY-MM-DD nap-kulcs. */
export function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Nap-kulcs eltolása naptári napokkal (negatív = visszafelé). */
export function addDays(iso: string, days: number): string {
  const date = parseDay(iso)
  date.setDate(date.getDate() + days)
  return formatDay(date)
}

/** Mai nap (helyi idő) YYYY-MM-DD kulcsként. */
export function todayIso(): string {
  return formatDay(new Date())
}

/** Előjeles naptári nap-különbség: b − a (b a jövőben → pozitív). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / DAY_MS)
}

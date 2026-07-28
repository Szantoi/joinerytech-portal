/**
 * Kapacitás-terhelés nézet-model — a szerver által számolt heti terhelés-jelentés
 * leképezése a domain-mentes `CapacityHeatmap` propjaira.
 *
 * Provenance: doorstar-instance `pages/production/LoadPage.tsx` +
 * `services/production/types.ts` (LoadReport/StationLoad/DayLoad) — PLAN-05 F2.
 *
 * Elv (a nézet-model rétegé): itt SEM számolunk terhelést vagy kapacitást — a
 * jelentés értékeit formázzuk és rendezzük vödrökbe. A nap-neveket az `Intl`
 * adja (nem kézzel írt DAY_NAMES tömb), minden szöveg formatter-propból jön.
 */

import type { CapacityBucket, CapacityRow } from '@spaceos/portal-ui'

export interface CapacityDayLoad {
  /** Nap-index a hét kezdetétől (0 = a hét első napja). */
  day: number
  hours: number
  taskCount: number
}

export interface CapacityStationLoad {
  station: string
  cells: readonly CapacityDayLoad[]
  totalHours: number
  /** Kihasználtság százalékban (100 felett túlterhelt). */
  utilizationPct: number
}

export interface CapacityLoadReport {
  /** A hét első napja ISO dátumként (`YYYY-MM-DD`). */
  weekStart: string
  /** Kapacitás egy állomásra, egy napra. */
  hoursPerDay: number
  stations: readonly CapacityStationLoad[]
  bottlenecks: readonly string[]
}

export interface CapacityLoadLabels {
  formatDayName: (date: Date) => string
  formatDayDetail: (date: Date) => string
  formatHours: (hours: number) => string
  formatTaskCount: (count: number) => string
  formatUtilization: (percent: number) => string
}

/** A portál alapértelmezett (magyar) formázói. */
export const DEFAULT_CAPACITY_LABELS: CapacityLoadLabels = {
  formatDayName: (date) => new Intl.DateTimeFormat('hu-HU', { weekday: 'short' }).format(date),
  formatDayDetail: (date) => `${date.getMonth() + 1}.${date.getDate()}.`,
  formatHours: (hours) => `${hours.toFixed(1)} ó`,
  formatTaskCount: (count) => `${count} feladat`,
  formatUtilization: (percent) => `${Math.round(percent)}%`,
}

const DAY_MS = 24 * 60 * 60 * 1000

export interface CapacityBucketOptions {
  dayCount?: number
  labels?: CapacityLoadLabels
  /** Ez a nap kap kiemelést (pl. „ma"); kívülről jön, hogy a model tiszta maradjon. */
  today?: Date
}

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
}

/** Nap-vödrök a hét kezdetétől. Érvénytelen dátumra üres lista — nincs félrevezető rács. */
export function buildCapacityBuckets(weekStart: string, options: CapacityBucketOptions = {}): CapacityBucket[] {
  const { dayCount = 7, labels = DEFAULT_CAPACITY_LABELS, today } = options
  const start = new Date(`${weekStart}T00:00:00`)
  if (!Number.isFinite(start.getTime())) return []

  const todayMs = today ? startOfDay(today) : undefined
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS)
    return {
      id: String(index),
      label: labels.formatDayName(date),
      detail: labels.formatDayDetail(date),
      highlighted: todayMs !== undefined && startOfDay(date) === todayMs,
    }
  })
}

/** Állomás-sorok a heti összegzővel; a cellák a nap-index szerinti vödörhöz kötődnek. */
export function buildCapacityRows(
  report: CapacityLoadReport,
  labels: CapacityLoadLabels = DEFAULT_CAPACITY_LABELS,
): CapacityRow[] {
  return report.stations.map((station) => ({
    id: station.station,
    label: station.station,
    cells: station.cells.map((cell) => ({
      bucketId: String(cell.day),
      value: cell.hours,
      detail: labels.formatTaskCount(cell.taskCount),
    })),
    summary: {
      label: labels.formatHours(station.totalHours),
      ratio: station.utilizationPct / 100,
      ratioLabel: labels.formatUtilization(station.utilizationPct),
    },
  }))
}

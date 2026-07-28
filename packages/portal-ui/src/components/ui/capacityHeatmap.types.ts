/**
 * CapacityHeatmap típusai és küszöb→tónus feloldása.
 *
 * Külön modul (a `dataTable.types.ts` mintájára), hogy a komponens-fájl csak
 * komponenst exportáljon (react-refresh konvenció), és hogy a jelmagyarázatot
 * építő kompozíció ugyanazt a tónus-szabályt használhassa, mint a rács.
 */

import type { Tone } from '../../theme/statusTones'

export interface CapacityBucket {
  id: string
  /** Oszlop elsődleges felirata (pl. nap rövid neve). */
  label: string
  /** Oszlop másodlagos felirata (pl. dátum). */
  detail?: string
  /** Kiemelt oszlop (pl. a mai nap). */
  highlighted?: boolean
}

export interface CapacityCell {
  bucketId: string
  /** A vödörre eső terhelés a `capacity`-vel azonos mértékegységben. */
  value: number
  /** Másodlagos cella-szöveg (pl. darabszám). */
  detail?: string
}

export interface CapacityRowSummary {
  /** Elsődleges összegző szöveg (pl. összes óra). */
  label: string
  /** Kihasználtság 0..1+ arányként; 1 felett túlterhelés. */
  ratio: number
  /** Az arány megjelenítendő alakja (pl. „112%"). */
  ratioLabel: string
}

export interface CapacityRow {
  id: string
  label: string
  cells: readonly CapacityCell[]
  summary?: CapacityRowSummary
}

export interface CapacityThresholds {
  /** Ez az arány FELETT figyelmeztető tónus (alapértelmezés 0.75). */
  warn: number
  /** Ez az arány FELETT túlterhelt tónus (alapértelmezés 1). */
  over: number
}

export const DEFAULT_CAPACITY_THRESHOLDS: CapacityThresholds = { warn: 0.75, over: 1 }

/** Terhelés/kapacitás arány → tónus (ok→success, warn→warn, over→danger). */
export function capacityTone(
  ratio: number,
  thresholds: CapacityThresholds = DEFAULT_CAPACITY_THRESHOLDS,
): Tone {
  if (ratio > thresholds.over) return 'danger'
  if (ratio > thresholds.warn) return 'warn'
  return 'success'
}

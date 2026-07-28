/**
 * CapacityHeatmap — domain-mentes kapacitás-rács (sorok × idő-vödrök).
 *
 * Provenance: a doorstar-instance `pages/production/LoadPage.tsx` rácsából
 * általánosítva (uzemi-tabla-web) — PLAN-05 F2. A kapacitás-szerkesztő input,
 * a magyar keret és a Doorstar-brand (kézírás-font, marker-színek) NEM jött át.
 *
 * A primitív nem ismer domain-fogalmat (részleg, nap, óra) és nem számol
 * terhelést: a szerver által adott értékeket festi tónusra a küszöbök szerint
 * (ld. `./capacityHeatmap.types.ts`).
 *  - minden felirat és számformázás kívülről jön → nincs beégetett nyelv;
 *  - szín kizárólag a STATUS_TONES-ból, inline style tilos.
 *
 * Hozzáférhetőség: valódi táblázat-szemantika (`<th scope>` sor- és
 * oszlopfejlécekkel), és a cella tónusa mellett a **szöveg is hordozza** az
 * információt (érték + részlet) — nem csak szín különbözteti meg az
 * állapotokat. A cella-tartalom min. 44px magas (érintési zóna).
 */

import { STATUS_TONES } from '../../theme/statusTones'
import {
  capacityTone,
  DEFAULT_CAPACITY_THRESHOLDS,
  type CapacityBucket,
  type CapacityRow,
  type CapacityThresholds,
} from './capacityHeatmap.types'

export interface CapacityHeatmapProps {
  buckets: readonly CapacityBucket[]
  rows: readonly CapacityRow[]
  /** A küszöbök alapja egy vödörre (pl. óra/nap). */
  capacity: number
  thresholds?: CapacityThresholds
  /** Cella-érték formázása (pl. ``(v) => `${v.toFixed(1)} ó` ``). */
  formatValue: (value: number) => string
  /** A táblázat hozzáférhető neve (kötelező — lokalizált szöveg). */
  ariaLabel: string
  /** Üzenet, ha nincs megjeleníthető sor (kötelező — lokalizált szöveg). */
  emptyLabel: string
  /** A sorfejléc-oszlop fejléce (kötelező — lokalizált szöveg). */
  rowHeaderLabel: string
  /** Az összegző oszlop fejléce; hiánya elrejti az oszlopot. */
  summaryHeaderLabel?: string
}

/**
 * Kihasználtság-sáv szélessége statikus utility-osztályokból, 5%-os lépcsőben.
 * Inline style tilos, a Tailwind pedig futásidejű értékből nem generál osztályt,
 * ezért a folytonos arány a legközelebbi lépcsőre kerekedik.
 */
const BAR_WIDTHS = [
  'w-0', 'w-[5%]', 'w-[10%]', 'w-[15%]', 'w-[20%]', 'w-[25%]', 'w-[30%]', 'w-[35%]',
  'w-[40%]', 'w-[45%]', 'w-[50%]', 'w-[55%]', 'w-[60%]', 'w-[65%]', 'w-[70%]', 'w-[75%]',
  'w-[80%]', 'w-[85%]', 'w-[90%]', 'w-[95%]', 'w-full',
] as const

function barWidthClass(ratio: number): string {
  const clamped = Math.max(0, Math.min(ratio, 1))
  return BAR_WIDTHS[Math.round(clamped * 20)]
}

export function CapacityHeatmap({
  buckets,
  rows,
  capacity,
  thresholds = DEFAULT_CAPACITY_THRESHOLDS,
  formatValue,
  ariaLabel,
  emptyLabel,
  rowHeaderLabel,
  summaryHeaderLabel,
}: CapacityHeatmapProps) {
  if (!rows.length || !buckets.length) {
    return (
      <p role="status" className="px-4 py-6 text-sm text-ink-soft">
        {emptyLabel}
      </p>
    )
  }

  const safeCapacity = capacity > 0 ? capacity : 1

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left" aria-label={ariaLabel}>
        <thead>
          <tr className="bg-surface-sunken">
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
              {rowHeaderLabel}
            </th>
            {buckets.map((bucket) => (
              <th
                key={bucket.id}
                scope="col"
                className={`border-l border-line px-2 py-2 text-[12px] font-semibold text-ink ${
                  bucket.highlighted ? 'bg-world-soft text-world-soft-fg' : ''
                }`}
              >
                <span className="uppercase">{bucket.label}</span>
                {bucket.detail && <span className="ml-1.5 font-normal text-ink-soft">{bucket.detail}</span>}
              </th>
            ))}
            {summaryHeaderLabel && (
              <th
                scope="col"
                className="border-l-2 border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
              >
                {summaryHeaderLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cellByBucket = new Map(row.cells.map((cell) => [cell.bucketId, cell]))
            const summaryTone = row.summary ? STATUS_TONES[capacityTone(row.summary.ratio, thresholds)] : undefined
            return (
              <tr key={row.id} className="border-t border-line">
                <th scope="row" className="px-3 py-2 text-[13px] font-semibold text-ink">
                  {row.label}
                </th>
                {buckets.map((bucket) => {
                  const cell = cellByBucket.get(bucket.id)
                  if (!cell) {
                    return <td key={bucket.id} className="border-l border-line px-2 py-2" />
                  }
                  const tone = STATUS_TONES[capacityTone(cell.value / safeCapacity, thresholds)]
                  return (
                    <td key={bucket.id} className={`border-l border-line px-2 py-2 align-top ${tone.bg}`}>
                      <div className={`min-h-[44px] text-[14px] font-semibold ${tone.fg}`}>
                        {formatValue(cell.value)}
                        {cell.detail && <div className="text-[10.5px] font-medium text-ink-soft">{cell.detail}</div>}
                      </div>
                    </td>
                  )
                })}
                {summaryHeaderLabel && (
                  <td className="border-l-2 border-line px-3 py-2">
                    {row.summary && summaryTone && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[12px] font-semibold text-ink">
                          <span>{row.summary.label}</span>
                          <span className={summaryTone.fg}>{row.summary.ratioLabel}</span>
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                          role="img"
                          aria-label={`${row.label}: ${row.summary.ratioLabel}`}
                        >
                          <div className={`h-full ${summaryTone.dot} ${barWidthClass(row.summary.ratio)}`} />
                        </div>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

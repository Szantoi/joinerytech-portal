/**
 * GanttChart — domain-mentes idősáv-primitív (sávok = `lanes`, elemek = `items`).
 *
 * Provenance: a doorstar-instance `DependencyGanttTimeline.tsx`-éből általánosítva
 * (uzemi-tabla-web/src/components/planning), ÖSSZEOLVASZTVA a portál korábbi
 * `ExecutionTimeline` + `TimelineRow` páros idősávjával — PLAN-05 F1.
 * A platformon ez az EGYETLEN idősáv-implementáció.
 *
 * A primitív nem ismer domain-fogalmat (művelet, gép, batch) és nem számol
 * ütemtervet: kizárólag a kapott intervallumokat rajzolja ki.
 *  - Érvénytelen intervallum (nem-dátum, `end <= start`) kimarad — a hibás adat
 *    nem lesz félrevezető ábra.
 *  - Minden felirat kívülről jön (`ariaLabel`, `emptyLabel`, tick-feliratok):
 *    a primitívben nincs beégetett nyelv.
 *  - Szín kizárólag a tónus-rendszerből (SVG_TONES) — hardcode és inline style
 *    tilos; a geometria SVG-attribútum, nem stílus.
 *  - Reszponzív: fix viewBox + `w-full h-auto`, vízszintes görgetéssel a
 *    minimális olvasható szélesség alatt.
 *
 * Skálázás (PLAN-05): az első verzió nem virtualizált. Nagy sávszám esetén a
 * követő lépés a sor-virtualizáció (react-window) és a zoom/pan a `domain`
 * prop vezérlésével — a jelenlegi API mindkettőt kifelé változatlanul hagyja.
 */

import { useId } from 'react'
import { SVG_AXIS, SVG_TONES } from '../../theme/svgTones'
import type { Tone } from '../../theme/statusTones'

/** ISO-sztring, epoch-ezredmásodperc vagy Date. */
export type GanttTimeValue = string | number | Date

export interface GanttItem {
  id: string
  /** A sávon megjelenő felirat. */
  label: string
  start: GanttTimeValue
  end: GanttTimeValue
  tone?: Tone
  /** Tooltip (SVG `<title>`); alapértelmezés a `label`. */
  title?: string
}

export interface GanttLane {
  id: string
  /** A bal oszlop sor-felirata. */
  label: string
  items: readonly GanttItem[]
}

export interface GanttTick {
  value: GanttTimeValue
  /** Üres sztringnél csak rácsvonal rajzolódik — így sűrű rács mellett is olvasható a felirat. */
  label: string
}

export interface GanttChartProps {
  lanes: readonly GanttLane[]
  /**
   * Kirajzolt időtartomány. Ha nincs megadva, az érvényes elemekből számolt
   * min/max. Rögzített tengelyhez (pl. egy naptári nap) mindig add meg.
   */
  domain?: { start: GanttTimeValue; end: GanttTimeValue }
  /** Osztásjelek: darabszám (egyenletes) vagy explicit lista saját feliratokkal. */
  ticks?: number | readonly GanttTick[]
  /** Felirat a darabszámos formához. Alapértelmezés: UTC `óó:pp`. */
  formatTick?: (value: number) => string
  /** Az ábra hozzáférhető neve (kötelező — lokalizált szöveg). */
  ariaLabel: string
  /** Üzenet, ha nincs megjeleníthető sáv (kötelező — lokalizált szöveg). */
  emptyLabel: string
  /** A bal oszlop szélessége viewBox-egységben. */
  laneLabelWidth?: number
  /** Sormagasság viewBox-egységben. */
  rowHeight?: number
  /** A rajzterület szélessége viewBox-egységben. */
  plotWidth?: number
}

const MIN_BAR_WIDTH = 12
const HEADER_HEIGHT = 28
const BAR_INSET = 7

interface PlacedItem {
  item: GanttItem
  start: number
  end: number
}

function toMs(value: GanttTimeValue): number | undefined {
  const parsed = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Csak az érvényes, szerver által adott intervallumokat engedi tovább. */
function placeItems(items: readonly GanttItem[]): PlacedItem[] {
  return items
    .map((item) => ({ item, start: toMs(item.start), end: toMs(item.end) }))
    .filter((entry): entry is PlacedItem => entry.start !== undefined && entry.end !== undefined && entry.end > entry.start)
}

function defaultFormatTick(value: number): string {
  return new Date(value).toISOString().slice(11, 16)
}

export function GanttChart({
  lanes,
  domain,
  ticks = 6,
  formatTick = defaultFormatTick,
  ariaLabel,
  emptyLabel,
  laneLabelWidth = 140,
  rowHeight = 44,
  plotWidth = 800,
}: GanttChartProps) {
  // A useId nyers értéke elválasztó karaktereket tartalmaz (React 19: «r1»),
  // az SVG `url(#…)` hivatkozás viszont csak névkarakterekkel biztonságos.
  const clipId = `gantt-plot-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const placedLanes = lanes.map((lane) => ({ lane, items: placeItems(lane.items) }))

  if (!placedLanes.length) {
    return (
      <p role="status" className="px-4 py-6 text-sm text-ink-soft">
        {emptyLabel}
      </p>
    )
  }

  const domainStart = domain ? toMs(domain.start) : undefined
  const domainEnd = domain ? toMs(domain.end) : undefined
  const allItems = placedLanes.flatMap((entry) => entry.items)
  const from = domainStart ?? (allItems.length ? Math.min(...allItems.map((entry) => entry.start)) : undefined)
  const to = domainEnd ?? (allItems.length ? Math.max(...allItems.map((entry) => entry.end)) : undefined)
  const hasScale = from !== undefined && to !== undefined && to > from
  const scaleFrom = from ?? 0
  const scaleTo = to ?? 1
  const span = hasScale ? scaleTo - scaleFrom : 1

  const xOf = (ms: number) => laneLabelWidth + ((ms - scaleFrom) / span) * plotWidth

  const width = laneLabelWidth + plotWidth
  const height = HEADER_HEIGHT + placedLanes.length * rowHeight

  const tickList: { x: number; label: string; key: string }[] = !hasScale
    ? []
    : typeof ticks === 'number'
      ? Array.from({ length: Math.max(ticks, 2) }, (_, index) => {
          const ms = scaleFrom + (index * span) / (Math.max(ticks, 2) - 1)
          return { x: xOf(ms), label: formatTick(ms), key: `${index}` }
        })
      : ticks.flatMap((tick, index) => {
          const ms = toMs(tick.value)
          return ms === undefined || ms < scaleFrom || ms > scaleTo
            ? []
            : [{ x: xOf(ms), label: tick.label, key: `${index}-${tick.label}` }]
        })

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full min-w-[640px]"
      >
        <title>{ariaLabel}</title>
        <defs>
          <clipPath id={clipId}>
            <rect x={laneLabelWidth} y="0" width={plotWidth} height={height} />
          </clipPath>
        </defs>

        {/* Időtengely-fejléc: osztásjelek + rács */}
        {tickList.map(({ x, label, key }, index) => (
          <g key={key}>
            <line x1={x} x2={x} y1={HEADER_HEIGHT} y2={height} className={SVG_AXIS.grid} strokeWidth="1" strokeDasharray="3 4" />
            {label !== '' && (
              <text
                x={x}
                y={HEADER_HEIGHT - 9}
                textAnchor={index === 0 ? 'start' : index === tickList.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                className={SVG_AXIS.tick}
              >
                {label}
              </text>
            )}
          </g>
        ))}

        {/* Sávok */}
        {placedLanes.map(({ lane, items }, row) => {
          const y = HEADER_HEIGHT + row * rowHeight
          return (
            <g key={lane.id}>
              <line x1="0" x2={width} y1={y} y2={y} className={SVG_AXIS.line} strokeWidth="1" />
              <text x="8" y={y + rowHeight / 2} dominantBaseline="middle" fontSize="12" fontWeight="600" className={SVG_AXIS.label}>
                {lane.label}
              </text>
              <g clipPath={`url(#${clipId})`}>
                {hasScale &&
                  items.map(({ item, start, end }) => {
                    const barX = xOf(start)
                    const barWidth = Math.max(xOf(end) - barX, MIN_BAR_WIDTH)
                    const tone = SVG_TONES[item.tone ?? 'neutral']
                    return (
                      <g key={item.id}>
                        <rect
                          x={barX}
                          y={y + BAR_INSET}
                          width={barWidth}
                          height={rowHeight - BAR_INSET * 2}
                          rx="3"
                          className={`${tone.fill} ${tone.stroke}`}
                          strokeWidth="1.5"
                        >
                          <title>{item.title ?? item.label}</title>
                        </rect>
                        <text
                          x={barX + 6}
                          y={y + rowHeight / 2}
                          dominantBaseline="middle"
                          fontSize="11"
                          fontWeight="600"
                          className={tone.text}
                        >
                          {item.label}
                        </text>
                      </g>
                    )
                  })}
              </g>
            </g>
          )
        })}

        {/* Záró sorvonal + a felirat-oszlop elválasztója */}
        <line x1="0" x2={width} y1={height} y2={height} className={SVG_AXIS.line} strokeWidth="1" />
        <line x1={laneLabelWidth} x2={laneLabelWidth} y1="0" y2={height} className={SVG_AXIS.line} strokeWidth="1" />
      </svg>
    </div>
  )
}

import { useState } from 'react'
import { Icon } from './ui'
import { CATALOG_LOOKUP } from '../mocks/worlds'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface PlacedPart {
  id: string
  x: number
  y: number
  width: number
  height: number
  materialType: string
  rotated?: boolean
}

export interface NestingSheet {
  id: string
  width: number
  height: number
  placedParts: PlacedPart[]
  wastePercentage: number
}

export interface NestingResultDto {
  sheets: NestingSheet[]
  strategy: 'Guillotine' | 'FFDH' | string
}

interface NestingViewerProps {
  data: NestingResultDto
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getMaterialColor(materialType: string): string {
  const entry = CATALOG_LOOKUP[materialType]
  return entry?.color ?? '#94a3b8' // fallback: stone-400
}

function getMaterialName(materialType: string): string {
  const entry = CATALOG_LOOKUP[materialType]
  return entry?.name ?? materialType
}

function getWasteColor(wastePercentage: number): string {
  if (wastePercentage > 15) return 'text-rose-700 bg-rose-50'
  if (wastePercentage > 10) return 'text-amber-700 bg-amber-50'
  return 'text-emerald-700 bg-emerald-50'
}

// ─── SVG Canvas Component ──────────────────────────────────────────────────────

interface NestingSVGProps {
  sheet: NestingSheet
  hoveredPart: string | null
  onHover: (id: string | null) => void
}

function NestingSVG({ sheet, hoveredPart, onHover }: NestingSVGProps) {
  // Auto-scale: fit the largest sheet dimension to 700px max
  const MAX_VIEWPORT = 700
  const scale = Math.min(MAX_VIEWPORT / sheet.width, MAX_VIEWPORT / sheet.height)
  const viewWidth = sheet.width * scale
  const viewHeight = sheet.height * scale

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      style={{ width: '100%', height: 'auto', maxHeight: '520px' }}
      className="block rounded-lg border border-stone-200"
    >
      {/* Sheet background */}
      <rect
        x="0"
        y="0"
        width={viewWidth}
        height={viewHeight}
        fill="#fafaf9"
        stroke="#a8a29e"
        strokeWidth="2"
      />

      {/* Placed parts */}
      {sheet.placedParts.map((part) => {
        const x = part.x * scale
        const y = part.y * scale
        const w = part.width * scale
        const h = part.height * scale
        const fill = getMaterialColor(part.materialType)
        const isHover = hoveredPart === part.id

        return (
          <g
            key={part.id}
            onMouseEnter={() => onHover(part.id)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              fillOpacity={isHover ? 0.95 : 0.75}
              stroke={isHover ? '#0f766e' : '#57534e'}
              strokeWidth={isHover ? 2 : 1}
            />
            {/* Part label */}
            <text
              x={x + w / 2}
              y={y + h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#1c1917"
              fontWeight="600"
              pointerEvents="none"
            >
              {part.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── NestingViewer Component ───────────────────────────────────────────────────

export function NestingViewer({ data }: NestingViewerProps) {
  const [sheetIndex, setSheetIndex] = useState(0)
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  if (!data || data.sheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-400 text-[13px]">
        Nincs nesting adat
      </div>
    )
  }

  const currentSheet = data.sheets[sheetIndex]
  const hasMultipleSheets = data.sheets.length > 1

  return (
    <div className="space-y-3">
      {/* Stats badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getWasteColor(currentSheet.wastePercentage)}`}>
            Hulladék: {currentSheet.wastePercentage.toFixed(1)}%
          </div>
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-700">
            Stratégia: {data.strategy}
          </div>
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-700">
            {data.sheets.length} lap
          </div>
        </div>
        {hasMultipleSheets && (
          <div className="text-[11px] text-stone-500 font-mono">
            Lap {sheetIndex + 1} / {data.sheets.length}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="bg-stone-50/40 rounded-lg border border-stone-200/70 p-3">
        <NestingSVG
          sheet={currentSheet}
          hoveredPart={hoveredPart}
          onHover={setHoveredPart}
        />
        <div className="mt-2 text-center text-[10.5px] text-stone-500 font-mono">
          {currentSheet.width} × {currentSheet.height} mm
        </div>
      </div>

      {/* Per-sheet navigation */}
      {hasMultipleSheets && (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setSheetIndex(Math.max(0, sheetIndex - 1))}
            disabled={sheetIndex === 0}
            className="w-8 h-8 grid place-items-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="chevron" size={14} className="rotate-180" />
          </button>

          <div className="flex items-center gap-1.5">
            {data.sheets.map((sheet, i) => {
              const isActive = i === sheetIndex
              return (
                <button
                  key={sheet.id}
                  onClick={() => setSheetIndex(i)}
                  title={`Lap ${i + 1} · ${sheet.wastePercentage.toFixed(1)}% hulladék`}
                  className={`relative w-10 h-8 rounded-md border-2 transition overflow-hidden ${
                    isActive ? 'border-teal-600 bg-teal-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-mono text-stone-700">
                    {i + 1}
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 ${isActive ? 'bg-teal-600' : 'bg-stone-300'}`}
                    style={{ width: `${100 - sheet.wastePercentage}%` }}
                  />
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setSheetIndex(Math.min(data.sheets.length - 1, sheetIndex + 1))}
            disabled={sheetIndex >= data.sheets.length - 1}
            className="w-8 h-8 grid place-items-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="chevron" size={14} />
          </button>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredPart && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-[11.5px]">
          <div className="font-semibold text-teal-900 mb-1">
            {hoveredPart}
          </div>
          {currentSheet.placedParts
            .filter((p) => p.id === hoveredPart)
            .map((p) => (
              <div key={p.id} className="text-teal-700 space-y-0.5">
                <div>
                  Méret: {p.width} × {p.height} mm
                </div>
                <div>
                  Anyag: {getMaterialName(p.materialType)}
                </div>
                {p.rotated && (
                  <div className="text-teal-600 text-[10px]">⟲ Forgatva 90°</div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

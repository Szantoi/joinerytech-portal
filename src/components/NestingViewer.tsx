import { useState, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import html2canvas from 'html2canvas'
import { Icon } from './ui'
import { CATALOG_LOOKUP } from '../mocks/worlds'

// ─── Backend DTO Interfaces (PascalCase, matches C# DTOs) ────────────────────

export interface PlacedPartResponse {
  PartName: string
  X: number
  Y: number
  WidthMm: number
  HeightMm: number
  IsRotated: boolean
}

export interface PanelAssignmentResponse {
  PanelStockId: string
  MaterialType: string
  PanelWidthMm: number
  PanelHeightMm: number
  PlacedParts: PlacedPartResponse[]
  WasteAreaMm2: number
  UtilizationPercent: number
}

export interface NestingGroupResponse {
  MaterialType: string
  ThicknessMm: number
  Lines: NestingLineResponse[]
}

export interface NestingLineResponse {
  PartName: string
  WidthMm: number
  HeightMm: number
  Quantity: number
}

export interface NestingResultResponse {
  SheetId: string
  OrderReference: string
  Groups: NestingGroupResponse[]
  TotalParts: number
  PanelAssignments: PanelAssignmentResponse[] | null
}

// ─── Frontend Display Interfaces (camelCase, used by UI components) ───────────

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
  strategy: string
  orderReference?: string
  totalParts?: number
}

// ─── Mapper Function: Backend DTO → Frontend Display ──────────────────────────

export function mapNestingResponse(response: NestingResultResponse): NestingResultDto {
  if (!response.PanelAssignments || response.PanelAssignments.length === 0) {
    return {
      sheets: [],
      strategy: 'Unknown',
      orderReference: response.OrderReference,
      totalParts: response.TotalParts,
    }
  }

  const sheets: NestingSheet[] = response.PanelAssignments.map((panel) => ({
    id: panel.PanelStockId,
    width: panel.PanelWidthMm,
    height: panel.PanelHeightMm,
    wastePercentage: 100 - panel.UtilizationPercent,
    placedParts: panel.PlacedParts.map((part) => ({
      id: part.PartName,
      x: part.X,
      y: part.Y,
      width: part.WidthMm,
      height: part.HeightMm,
      materialType: panel.MaterialType,
      rotated: part.IsRotated,
    })),
  }))

  // Strategy can be inferred from Groups if needed, or default
  const strategy = response.Groups?.[0]?.MaterialType ? 'Optimized' : 'Default'

  return {
    sheets,
    strategy,
    orderReference: response.OrderReference,
    totalParts: response.TotalParts,
  }
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
  selectedPart: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}

function NestingSVG({ sheet, hoveredPart, selectedPart, onHover, onSelect }: NestingSVGProps) {
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
        const isSelected = selectedPart === part.id

        return (
          <g
            key={part.id}
            onMouseEnter={() => onHover(part.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(isSelected ? null : part.id)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              fillOpacity={isSelected ? 0.95 : isHover ? 0.85 : 0.75}
              stroke={isSelected ? '#0d9488' : isHover ? '#0f766e' : '#57534e'}
              strokeWidth={isSelected ? 3 : isHover ? 2 : 1}
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
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  if (!data || data.sheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-400 text-[13px]">
        Nincs nesting adat
      </div>
    )
  }

  const currentSheet = data.sheets[sheetIndex]
  const hasMultipleSheets = data.sheets.length > 1
  const selectedPartData = selectedPart
    ? currentSheet.placedParts.find(p => p.id === selectedPart)
    : null

  const handleExportPNG = async () => {
    if (!exportRef.current) return

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#fafaf9',
        scale: 2,
      })
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `nesting-${currentSheet.id}-${Date.now()}.png`
      link.href = url
      link.click()
    } catch (error) {
      console.error('PNG export failed:', error)
      alert('PNG exportálás sikertelen')
    }
  }

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
        <div className="flex items-center gap-2">
          {hasMultipleSheets && (
            <div className="text-[11px] text-stone-500 font-mono">
              Lap {sheetIndex + 1} / {data.sheets.length}
            </div>
          )}
          <button
            onClick={handleExportPNG}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition"
            title="PNG export"
          >
            <Icon name="download" size={12} />
            PNG
          </button>
        </div>
      </div>

      {/* SVG Canvas with Pan & Zoom */}
      <div ref={exportRef} className="bg-stone-50/40 rounded-lg border border-stone-200/70 p-3">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: false }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => zoomIn()}
                  className="w-7 h-7 grid place-items-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition"
                  title="Nagyítás"
                >
                  <Icon name="plus" size={14} />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="w-7 h-7 grid place-items-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition"
                  title="Kicsinyítés"
                >
                  <Icon name="minus" size={14} />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="w-7 h-7 grid place-items-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition"
                  title="Reset"
                >
                  <Icon name="refresh" size={14} />
                </button>
                <div className="ml-2 text-[10px] text-stone-500">
                  Görgővel nagyítás, húzással mozgatás
                </div>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%' }} contentStyle={{ width: '100%' }}>
                <NestingSVG
                  sheet={currentSheet}
                  hoveredPart={hoveredPart}
                  selectedPart={selectedPart}
                  onHover={setHoveredPart}
                  onSelect={setSelectedPart}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
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

      {/* Selected part detail panel */}
      {selectedPartData && (
        <div className="p-4 rounded-lg bg-teal-50 border-2 border-teal-500 text-[12px]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-teal-600 font-medium mb-0.5">
                Kiválasztott alkatrész
              </div>
              <div className="font-semibold text-teal-900 text-[14px]">
                {selectedPartData.id}
              </div>
            </div>
            <button
              onClick={() => setSelectedPart(null)}
              className="w-6 h-6 grid place-items-center rounded-md hover:bg-teal-100 text-teal-700 transition"
              title="Bezár"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-teal-600 mb-0.5">Szélesség</div>
              <div className="font-mono text-teal-900">{selectedPartData.width} mm</div>
            </div>
            <div>
              <div className="text-[10px] text-teal-600 mb-0.5">Magasság</div>
              <div className="font-mono text-teal-900">{selectedPartData.height} mm</div>
            </div>
            <div>
              <div className="text-[10px] text-teal-600 mb-0.5">Pozíció X</div>
              <div className="font-mono text-teal-900">{selectedPartData.x} mm</div>
            </div>
            <div>
              <div className="text-[10px] text-teal-600 mb-0.5">Pozíció Y</div>
              <div className="font-mono text-teal-900">{selectedPartData.y} mm</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] text-teal-600 mb-0.5">Anyag</div>
              <div className="text-teal-900">{getMaterialName(selectedPartData.materialType)}</div>
            </div>
            {selectedPartData.rotated && (
              <div className="col-span-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-100 text-teal-800 text-[10px] font-medium">
                  <Icon name="refresh" size={10} />
                  Forgatva 90°
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover tooltip (only when not selected) */}
      {hoveredPart && !selectedPart && (
        <div className="p-3 rounded-lg bg-stone-100 border border-stone-200 text-[11.5px]">
          <div className="font-semibold text-stone-900 mb-1">
            {hoveredPart}
          </div>
          {currentSheet.placedParts
            .filter((p) => p.id === hoveredPart)
            .map((p) => (
              <div key={p.id} className="text-stone-700 space-y-0.5">
                <div>
                  Méret: {p.width} × {p.height} mm
                </div>
                <div>
                  Anyag: {getMaterialName(p.materialType)}
                </div>
                {p.rotated && (
                  <div className="text-stone-600 text-[10px]">⟲ Forgatva 90°</div>
                )}
                <div className="text-[10px] text-stone-500 mt-1">
                  Kattintson a részletes nézethez
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

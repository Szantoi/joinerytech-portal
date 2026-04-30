import { useState } from 'react'
import { Card, StatusPill } from '../components/ui'
import { CUTTING_PLANS, NESTING, I18N } from '../mocks/data'
import type { NestingPart } from '../types'

export function ProductionPage() {
  const t = I18N.hu
  const [tab, setTab] = useState<'cutting' | 'machining'>('cutting')
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  const tabs = [
    { key: 'cutting' as const, label: t.prod.tabs.cutting },
    { key: 'machining' as const, label: t.prod.tabs.machining },
  ]

  return (
    <div className="p-7 space-y-5">
      <div>
        <h2 className="text-[18px] font-semibold text-stone-900">{t.prod.title}</h2>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition ${
              tab === tb.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'cutting' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-0">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="text-[13px] font-semibold text-stone-900">{t.prod.cuttingPlans}</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {CUTTING_PLANS.map((cp) => (
                <div key={cp.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-stone-900">{cp.id}</div>
                    <div className="text-[11px] text-stone-500">{cp.material} &middot; {cp.operator}</div>
                  </div>
                  <div className="text-[11px] text-stone-500">{cp.sheets} lap</div>
                  <div className="text-[11px] font-medium text-teal-700">{cp.util}%</div>
                  <StatusPill status={cp.status} label={t.status[cp.status]} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-stone-900 mb-3">{t.prod.nesting}</h3>
            <div className="text-[11px] text-stone-500 mb-2">
              {t.prod.sheet}: {NESTING.sheet.w}&times;{NESTING.sheet.h} mm &middot; {t.prod.parts}: {NESTING.parts.length}
            </div>
            <NestingSVG
              parts={NESTING.parts}
              sheetW={NESTING.sheet.w}
              sheetH={NESTING.sheet.h}
              hoveredPart={hoveredPart}
              onHover={setHoveredPart}
            />
            {hoveredPart && (
              <div className="mt-2 text-[11px] text-stone-600 font-medium">
                {NESTING.parts.find((p) => p.id === hoveredPart)?.label}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'machining' && (
        <Card className="p-8 text-center">
          <div className="text-[14px] text-stone-500">CNC megmunkálás modul hamarosan</div>
        </Card>
      )}
    </div>
  )
}

interface NestingSVGProps {
  parts: NestingPart[]
  sheetW: number
  sheetH: number
  hoveredPart: string | null
  onHover: (id: string | null) => void
}

function NestingSVG({ parts, sheetW, sheetH, hoveredPart, onHover }: NestingSVGProps) {
  const scale = 0.12
  const svgW = sheetW * scale
  const svgH = sheetH * scale

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="bg-stone-100 rounded-lg">
      <rect x="0" y="0" width={svgW} height={svgH} fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
      {parts.map((p) => {
        const hovered = hoveredPart === p.id
        return (
          <g key={p.id} onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}>
            <rect
              x={p.x * scale}
              y={p.y * scale}
              width={p.w * scale}
              height={p.h * scale}
              fill={hovered ? '#99f6e4' : '#ccfbf1'}
              stroke={hovered ? '#0d9488' : '#5eead4'}
              strokeWidth={hovered ? 1.5 : 0.8}
              rx="1"
            />
            {p.w * scale > 30 && p.h * scale > 12 && (
              <text
                x={p.x * scale + (p.w * scale) / 2}
                y={p.y * scale + (p.h * scale) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="6"
                fill="#115e59"
                className="pointer-events-none"
              >
                {p.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

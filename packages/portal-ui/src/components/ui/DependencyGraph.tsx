/**
 * DependencyGraph — domain-mentes függőségi háló (csomópontok sávokba rendezve).
 *
 * Provenance: a doorstar-instance `WorkflowDependencyGraph.tsx`-éből általánosítva
 * (uzemi-tabla-web/src/components/planning) — PLAN-05 F1.
 *
 * A primitív nem ismer függőség-típust (FS/SS/FF/SF) és nem következtet élre:
 *  - a csomópontok a `lane` mezőjük szerint kerülnek oszlopba (első előfordulás
 *    sorrendjében), a sávon belül a bemeneti sorrend marad;
 *  - az él CSAK akkor rajzolódik, ha MINDKÉT végpontja létező csomópont — hiányzó
 *    végpontra nem születik kitalált kapcsolat;
 *  - a felirat (`label`) és a vonalstílus (`dashed`) hívói döntés.
 * Szín kizárólag a tónus-rendszerből (SVG_TONES); a méretek prop-ok.
 */

import { useId } from 'react'
import { SVG_AXIS, SVG_TONES } from '../../theme/svgTones'
import type { Tone } from '../../theme/statusTones'

export interface DependencyGraphNode {
  id: string
  /** Elsődleges felirat a csomóponton. */
  label: string
  /** Másodlagos felirat (pl. csoport/fázis neve). */
  detail?: string
  /** Oszlop-csoport; azonos `lane` értékek egy oszlopba kerülnek. */
  lane?: string
  tone?: Tone
  /** Tooltip (SVG `<title>`); alapértelmezés `label (detail)`. */
  title?: string
}

export interface DependencyGraphEdge {
  fromId: string
  toId: string
  /** Az élre írt felirat (pl. típus + késleltetés) — lokalizált szöveg. */
  label?: string
  /** Szaggatott vonal (pl. nem-alapértelmezett kapcsolat jelzésére). */
  dashed?: boolean
}

export interface DependencyGraphProps {
  nodes: readonly DependencyGraphNode[]
  edges: readonly DependencyGraphEdge[]
  /** Az ábra hozzáférhető neve (kötelező — lokalizált szöveg). */
  ariaLabel: string
  /** Üzenet, ha nincs megjeleníthető csomópont (kötelező — lokalizált szöveg). */
  emptyLabel: string
  /** Oszlop-osztásköz viewBox-egységben. */
  laneWidth?: number
  /** Sor-osztásköz viewBox-egységben. */
  rowHeight?: number
  nodeWidth?: number
  nodeHeight?: number
}

interface PlacedNode {
  node: DependencyGraphNode
  x: number
  y: number
}

export function DependencyGraph({
  nodes,
  edges,
  ariaLabel,
  emptyLabel,
  laneWidth = 235,
  rowHeight = 90,
  nodeWidth = 120,
  nodeHeight = 44,
}: DependencyGraphProps) {
  // A useId nyers értéke elválasztó karaktereket tartalmaz (React 19: «r1»),
  // az SVG `url(#…)` hivatkozás viszont csak névkarakterekkel biztonságos.
  const arrowId = `dep-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  if (!nodes.length) {
    return (
      <p role="status" className="px-4 py-6 text-sm text-ink-soft">
        {emptyLabel}
      </p>
    )
  }

  const lanes = [...new Set(nodes.map((node) => node.lane ?? ''))]
  const rowsPerLane = new Map<string, number>()
  const placed: PlacedNode[] = nodes.map((node) => {
    const lane = node.lane ?? ''
    const row = rowsPerLane.get(lane) ?? 0
    rowsPerLane.set(lane, row + 1)
    return {
      node,
      x: nodeWidth / 2 + lanes.indexOf(lane) * laneWidth,
      y: nodeHeight / 2 + 16 + row * rowHeight,
    }
  })

  const nodeById = new Map(placed.map((entry) => [entry.node.id, entry]))
  const placedEdges = edges.flatMap((edge) => {
    const from = nodeById.get(edge.fromId)
    const to = nodeById.get(edge.toId)
    return from && to ? [{ edge, from, to }] : []
  })

  const width = Math.max(...placed.map((entry) => entry.x)) + nodeWidth + 40
  const height = Math.max(...placed.map((entry) => entry.y)) + nodeHeight

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full min-w-[560px]"
      >
        <title>{ariaLabel}</title>
        <defs>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className={`${SVG_AXIS.label} stroke-none`} />
          </marker>
        </defs>

        {placedEdges.map(({ edge, from, to }) => {
          const fromX = from.x + nodeWidth / 2
          const toX = to.x - nodeWidth / 2
          const middleX = (fromX + toX) / 2
          const middleY = (from.y + to.y) / 2
          return (
            <g key={`${edge.fromId}-${edge.toId}-${edge.label ?? ''}`}>
              <path
                d={`M ${fromX} ${from.y} C ${middleX} ${from.y}, ${middleX} ${to.y}, ${toX} ${to.y}`}
                fill="none"
                className={SVG_AXIS.line}
                strokeWidth="1.5"
                strokeDasharray={edge.dashed ? '5 4' : undefined}
                markerEnd={`url(#${arrowId})`}
              >
                {edge.label && <title>{edge.label}</title>}
              </path>
              {edge.label && (
                <text x={middleX} y={middleY - 5} textAnchor="middle" fontSize="11" fontWeight="600" className={SVG_AXIS.label}>
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}

        {placed.map(({ node, x, y }) => {
          const tone = SVG_TONES[node.tone ?? 'neutral']
          return (
            <g key={node.id}>
              <rect
                x={x - nodeWidth / 2}
                y={y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx="4"
                className={`${tone.fill} ${tone.stroke}`}
                strokeWidth="2"
              >
                <title>{node.title ?? (node.detail ? `${node.label} (${node.detail})` : node.label)}</title>
              </rect>
              <text
                x={x}
                y={node.detail ? y - 3 : y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                className={tone.text}
              >
                {node.label}
              </text>
              {node.detail && (
                <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle" fontSize="10" className={SVG_AXIS.muted}>
                  {node.detail}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

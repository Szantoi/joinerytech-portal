// ─── Process Model — Folyamat-motor ───────────────────────────────────────────
// Konstansok, típusok és helper függvények a folyamat-szerkesztőhöz

// ─── Color Palette ────────────────────────────────────────────────────────────

export const PROC_PALETTE = [
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
] as const

export type ProcColor = (typeof PROC_PALETTE)[number]

// ─── Actors ───────────────────────────────────────────────────────────────────

export const PROC_ACTORS = [
  'manufacturer',
  'supplier',
  'installer',
  'designer',
  'dealer',
  'client',
] as const

export type ProcActor = (typeof PROC_ACTORS)[number]

interface ActorMeta {
  label: string
  icon: string
  tint: string
}

const ACTOR_META: Record<ProcActor, ActorMeta> = {
  manufacturer: { label: 'Gyártó', icon: 'factory', tint: 'teal' },
  supplier:     { label: 'Beszállító', icon: 'truck', tint: 'amber' },
  installer:    { label: 'Beszerelő', icon: 'wrench', tint: 'violet' },
  designer:     { label: 'Tervező', icon: 'ruler', tint: 'pink' },
  dealer:       { label: 'Kereskedő', icon: 'storefront', tint: 'blue' },
  client:       { label: 'Ügyfél', icon: 'user', tint: 'green' },
}

export function procActor(key: ProcActor): ActorMeta {
  return ACTOR_META[key] ?? { label: key, icon: 'user', tint: 'stone' }
}

// ─── Segment Types ────────────────────────────────────────────────────────────

export const SEG_TYPES = ['step', 'branch', 'parallel', 'loop'] as const
export type SegType = (typeof SEG_TYPES)[number]

interface SegMeta {
  label: string
  icon: string
  color: string
  description: string
}

export const SEG_META: Record<SegType, SegMeta> = {
  step:     { label: 'Lépés', icon: 'chevron', color: 'stone', description: 'Egyszerű művelet' },
  branch:   { label: 'Elágazás', icon: 'route', color: 'amber', description: 'Feltételes útvonalak' },
  parallel: { label: 'Párhuzam', icon: 'workflow', color: 'blue', description: 'Egyidejű sávok' },
  loop:     { label: 'Ciklus', icon: 'bolt', color: 'purple', description: 'Ismétlődő szakasz' },
}

// ─── Segment Interfaces ───────────────────────────────────────────────────────

export interface BaseSegment {
  id: string
  type: SegType
}

export interface StepSegment extends BaseSegment {
  type: 'step'
  name: string
  actor?: ProcActor
  color?: ProcColor
  duration?: number // minutes
  instructions?: string
}

export interface BranchSegment extends BaseSegment {
  type: 'branch'
  name: string
  condition?: string
  paths: FlowSegment[][] // each path is an array of segments
}

export interface ParallelSegment extends BaseSegment {
  type: 'parallel'
  name: string
  lanes: FlowSegment[][] // each lane runs simultaneously
}

export interface LoopSegment extends BaseSegment {
  type: 'loop'
  name: string
  targetStepId?: string // ID of step to return to
  maxIterations?: number
  condition?: string
}

export type FlowSegment = StepSegment | BranchSegment | ParallelSegment | LoopSegment

export type Flow = FlowSegment[]

// ─── ID Generator ─────────────────────────────────────────────────────────────

let segCounter = 0

export function segId(prefix = 'seg'): string {
  segCounter++
  return `${prefix}-${Date.now()}-${segCounter}`
}

// ─── Segment Factories ────────────────────────────────────────────────────────

export function newStep(name = 'Új lépés', actor?: ProcActor): StepSegment {
  return {
    id: segId('step'),
    type: 'step',
    name,
    actor,
  }
}

export function newBranch(name = 'Elágazás'): BranchSegment {
  return {
    id: segId('branch'),
    type: 'branch',
    name,
    paths: [
      [newStep('Út A')],
      [newStep('Út B')],
    ],
  }
}

export function newParallel(name = 'Párhuzam'): ParallelSegment {
  return {
    id: segId('parallel'),
    type: 'parallel',
    name,
    lanes: [
      [newStep('Sáv 1')],
      [newStep('Sáv 2')],
    ],
  }
}

export function newLoop(name = 'Ciklus', targetStepId?: string): LoopSegment {
  return {
    id: segId('loop'),
    type: 'loop',
    name,
    targetStepId,
    maxIterations: 3,
  }
}

// ─── Recursive Flow Helpers ───────────────────────────────────────────────────

/**
 * Recursively map over all segments in a flow
 */
export function mapFlow(flow: Flow, fn: (seg: FlowSegment) => FlowSegment): Flow {
  return flow.map((seg) => {
    const mapped = fn(seg)

    if (mapped.type === 'branch') {
      return {
        ...mapped,
        paths: mapped.paths.map((path) => mapFlow(path, fn)),
      }
    }

    if (mapped.type === 'parallel') {
      return {
        ...mapped,
        lanes: mapped.lanes.map((lane) => mapFlow(lane, fn)),
      }
    }

    return mapped
  })
}

/**
 * Find a segment by ID recursively
 */
export function findSeg(flow: Flow, id: string): FlowSegment | null {
  for (const seg of flow) {
    if (seg.id === id) return seg

    if (seg.type === 'branch') {
      for (const path of seg.paths) {
        const found = findSeg(path, id)
        if (found) return found
      }
    }

    if (seg.type === 'parallel') {
      for (const lane of seg.lanes) {
        const found = findSeg(lane, id)
        if (found) return found
      }
    }
  }
  return null
}

/**
 * Update a segment by ID
 */
export function updateSeg(flow: Flow, id: string, updates: Partial<FlowSegment>): Flow {
  return mapFlow(flow, (seg) => {
    if (seg.id === id) {
      return { ...seg, ...updates } as FlowSegment
    }
    return seg
  })
}

/**
 * Remove a segment by ID
 */
export function removeSeg(flow: Flow, id: string): Flow {
  const result: Flow = []

  for (const seg of flow) {
    if (seg.id === id) continue

    if (seg.type === 'branch') {
      result.push({
        ...seg,
        paths: seg.paths.map((path) => removeSeg(path, id)),
      })
    } else if (seg.type === 'parallel') {
      result.push({
        ...seg,
        lanes: seg.lanes.map((lane) => removeSeg(lane, id)),
      })
    } else {
      result.push(seg)
    }
  }

  return result
}

/**
 * Insert a segment after another segment (by ID)
 * If afterId is null, insert at the beginning
 */
export function insertSeg(flow: Flow, newSeg: FlowSegment, afterId: string | null): Flow {
  if (afterId === null) {
    return [newSeg, ...flow]
  }

  const result: Flow = []

  for (const seg of flow) {
    result.push(seg)

    if (seg.id === afterId) {
      result.push(newSeg)
    } else if (seg.type === 'branch') {
      // Check inside paths
      const updatedPaths = seg.paths.map((path) => insertSeg(path, newSeg, afterId))
      result[result.length - 1] = { ...seg, paths: updatedPaths }
    } else if (seg.type === 'parallel') {
      // Check inside lanes
      const updatedLanes = seg.lanes.map((lane) => insertSeg(lane, newSeg, afterId))
      result[result.length - 1] = { ...seg, lanes: updatedLanes }
    }
  }

  return result
}

/**
 * Move a segment up or down within its container
 */
export function moveSeg(flow: Flow, id: string, direction: 'up' | 'down'): Flow {
  const moveInArray = (arr: Flow): Flow => {
    const idx = arr.findIndex((s) => s.id === id)
    if (idx === -1) {
      // Not found at this level, recurse
      return arr.map((seg) => {
        if (seg.type === 'branch') {
          return { ...seg, paths: seg.paths.map(moveInArray) }
        }
        if (seg.type === 'parallel') {
          return { ...seg, lanes: seg.lanes.map(moveInArray) }
        }
        return seg
      })
    }

    // Found, move it
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= arr.length) return arr

    const result = [...arr]
    const [moved] = result.splice(idx, 1)
    result.splice(newIdx, 0, moved)
    return result
  }

  return moveInArray(flow)
}

// ─── Branch Helpers ───────────────────────────────────────────────────────────

/**
 * Add a new path to a branch segment
 */
export function addPath(flow: Flow, branchId: string): Flow {
  return mapFlow(flow, (seg) => {
    if (seg.id === branchId && seg.type === 'branch') {
      return {
        ...seg,
        paths: [...seg.paths, [newStep(`Út ${String.fromCharCode(65 + seg.paths.length)}`)]],
      }
    }
    return seg
  })
}

/**
 * Remove a path from a branch segment (by index)
 */
export function removePath(flow: Flow, branchId: string, pathIndex: number): Flow {
  return mapFlow(flow, (seg) => {
    if (seg.id === branchId && seg.type === 'branch') {
      if (seg.paths.length <= 2) return seg // Keep at least 2 paths
      return {
        ...seg,
        paths: seg.paths.filter((_, i) => i !== pathIndex),
      }
    }
    return seg
  })
}

// ─── Parallel Helpers ─────────────────────────────────────────────────────────

/**
 * Add a new lane to a parallel segment
 */
export function addLane(flow: Flow, parallelId: string): Flow {
  return mapFlow(flow, (seg) => {
    if (seg.id === parallelId && seg.type === 'parallel') {
      return {
        ...seg,
        lanes: [...seg.lanes, [newStep(`Sáv ${seg.lanes.length + 1}`)]],
      }
    }
    return seg
  })
}

/**
 * Remove a lane from a parallel segment (by index)
 */
export function removeLane(flow: Flow, parallelId: string, laneIndex: number): Flow {
  return mapFlow(flow, (seg) => {
    if (seg.id === parallelId && seg.type === 'parallel') {
      if (seg.lanes.length <= 2) return seg // Keep at least 2 lanes
      return {
        ...seg,
        lanes: seg.lanes.filter((_, i) => i !== laneIndex),
      }
    }
    return seg
  })
}

// ─── Collectors ───────────────────────────────────────────────────────────────

/**
 * Collect all step segments from a flow (for loop target selection)
 */
export function allSteps(flow: Flow): StepSegment[] {
  const steps: StepSegment[] = []

  const collect = (segments: Flow) => {
    for (const seg of segments) {
      if (seg.type === 'step') {
        steps.push(seg)
      } else if (seg.type === 'branch') {
        for (const path of seg.paths) {
          collect(path)
        }
      } else if (seg.type === 'parallel') {
        for (const lane of seg.lanes) {
          collect(lane)
        }
      }
    }
  }

  collect(flow)
  return steps
}

/**
 * Count all segments in a flow
 */
export function countSegments(flow: Flow): { total: number; byType: Record<SegType, number> } {
  const byType: Record<SegType, number> = { step: 0, branch: 0, parallel: 0, loop: 0 }

  const count = (segments: Flow) => {
    for (const seg of segments) {
      byType[seg.type]++

      if (seg.type === 'branch') {
        for (const path of seg.paths) {
          count(path)
        }
      } else if (seg.type === 'parallel') {
        for (const lane of seg.lanes) {
          count(lane)
        }
      }
    }
  }

  count(flow)
  return { total: Object.values(byType).reduce((a, b) => a + b, 0), byType }
}

// ─── Window Export (for debugging) ────────────────────────────────────────────

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).processModel = {
    PROC_PALETTE,
    PROC_ACTORS,
    procActor,
    SEG_META,
    segId,
    newStep,
    newBranch,
    newParallel,
    newLoop,
    mapFlow,
    findSeg,
    updateSeg,
    removeSeg,
    insertSeg,
    moveSeg,
    addPath,
    removePath,
    addLane,
    removeLane,
    allSteps,
    countSegments,
  }
}

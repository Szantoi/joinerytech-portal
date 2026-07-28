/**
 * Planning nézet-model — a szerver által adott ütemterv-javaslat megjelenítése.
 *
 * Provenance: doorstar-instance `uzemi-tabla-web/src/components/planning/
 * planningVisualizationModel.ts` általánosítva a platformra (PLAN-05 F1).
 * A Doorstar a saját UI-ját változatlanul viszi tovább; a forrásfájlok ott
 * fagyasztva vannak.
 *
 * Elv (a forrásból változatlanul): ez a réteg SOHA nem számol ütemtervet, nem
 * következtet élre és nem módosít kapacitást — a szerver dátumait és
 * kapcsolatait fordítja le a domain-mentes portal-ui primitívek propjaira.
 * A magyar szövegek formatter-propokba kerültek (`DependencyLabelFormatters`),
 * az alapértelmezés a portál nyelve.
 */

import type { DependencyGraphEdge, DependencyGraphNode, GanttLane, Tone } from '@spaceos/portal-ui'

export type VisualDependencyType = 'FS' | 'SS' | 'FF' | 'SF'
export type PlanningVisualStatus = 'proposal' | 'warning' | 'published' | 'blocked'

export interface PlanningVisualOperation {
  id: string
  label: string
  stage: string
  scheduledStart: string
  scheduledFinish: string
  status: PlanningVisualStatus
}

export interface PlanningVisualDependency {
  predecessorId: string
  successorId: string
  type: VisualDependencyType
  lagMinutes: number
  partialReleasePercent?: number
}

/** Javaslat-státusz → design-system tónus (PLAN-05 F1 térkép). */
export const PLANNING_STATUS_TONES: Record<PlanningVisualStatus, Tone> = {
  proposal: 'info',
  warning: 'warn',
  published: 'success',
  blocked: 'danger',
}

export interface DependencyLabelFormatters {
  /** Előjeles késleltetés (0 percnél nem hívjuk meg). */
  formatLag: (minutes: number) => string
  /** Részleges kiadás aránya 0..1 között. */
  formatPartialRelease: (ratio: number) => string
}

/** A portál alapértelmezett (magyar) él-feliratai. */
export const DEFAULT_DEPENDENCY_LABELS: DependencyLabelFormatters = {
  formatLag: (minutes) => `${minutes > 0 ? '+' : ''}${minutes} perc`,
  formatPartialRelease: (ratio) => `részleges kiadás ${Math.round(ratio * 100)}%`,
}

/** A négy függőség-típus és az audit-részletek (késleltetés, részleges kiadás) láthatók maradnak. */
export function dependencyLabel(
  dependency: PlanningVisualDependency,
  labels: DependencyLabelFormatters = DEFAULT_DEPENDENCY_LABELS,
): string {
  const lag = dependency.lagMinutes === 0 ? '' : ` ${labels.formatLag(dependency.lagMinutes)}`
  const partial =
    dependency.partialReleasePercent == null ? '' : ` · ${labels.formatPartialRelease(dependency.partialReleasePercent)}`
  return `${dependency.type}${lag}${partial}`
}

function isValidInterval(operation: PlanningVisualOperation): boolean {
  const start = Date.parse(operation.scheduledStart)
  const finish = Date.parse(operation.scheduledFinish)
  return Number.isFinite(start) && Number.isFinite(finish) && finish > start
}

/**
 * Műveletenként egy Gantt-sáv: a sor felirata a művelet neve, a szakaszé a sávon.
 * Csak az érvényes, szerver által adott intervallumok kerülnek be — a hibás adat
 * nem lesz félrevezető ábra.
 */
export function buildPlanningGanttLanes(operations: readonly PlanningVisualOperation[]): GanttLane[] {
  return operations.filter(isValidInterval).map((operation) => ({
    id: operation.id,
    label: operation.label,
    items: [
      {
        id: operation.id,
        label: operation.stage,
        start: operation.scheduledStart,
        end: operation.scheduledFinish,
        tone: PLANNING_STATUS_TONES[operation.status],
        title: `${operation.label}: ${operation.scheduledStart} – ${operation.scheduledFinish}`,
      },
    ],
  }))
}

/**
 * Függőségi háló: a műveletek a `stage` mezőjük szerint kerülnek oszlopba.
 * Hiányzó végpontra NEM születik kitalált él.
 */
export function buildPlanningGraph(
  operations: readonly PlanningVisualOperation[],
  dependencies: readonly PlanningVisualDependency[],
  labels: DependencyLabelFormatters = DEFAULT_DEPENDENCY_LABELS,
): { nodes: DependencyGraphNode[]; edges: DependencyGraphEdge[] } {
  const nodes: DependencyGraphNode[] = operations.map((operation) => ({
    id: operation.id,
    label: operation.label,
    detail: operation.stage,
    lane: operation.stage,
    tone: PLANNING_STATUS_TONES[operation.status],
    title: `${operation.label} (${operation.stage})`,
  }))
  const known = new Set(nodes.map((node) => node.id))
  const edges: DependencyGraphEdge[] = dependencies.flatMap((dependency) =>
    known.has(dependency.predecessorId) && known.has(dependency.successorId)
      ? [
          {
            fromId: dependency.predecessorId,
            toId: dependency.successorId,
            label: dependencyLabel(dependency, labels),
            dashed: dependency.type !== 'FS',
          },
        ]
      : [],
  )
  return { nodes, edges }
}

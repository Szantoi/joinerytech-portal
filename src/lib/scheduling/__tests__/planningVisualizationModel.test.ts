/**
 * Átemelve: doorstar-instance `planningVisualizationModel.unit.test.ts` (PLAN-05 F1).
 * Az eredeti három invariáns változatlanul él tovább; a nyelvfüggetlenség és a
 * tónus-térkép új asserttel bővült.
 */

import { describe, expect, it } from 'vitest'
import {
  buildPlanningGanttLanes,
  buildPlanningGraph,
  dependencyLabel,
  PLANNING_STATUS_TONES,
  type PlanningVisualDependency,
  type PlanningVisualOperation,
} from '../planningVisualizationModel'

const operations: PlanningVisualOperation[] = [
  { id: 'cut', label: 'Szabás', stage: 'Szabászat', scheduledStart: '2026-08-03T06:00:00+02:00', scheduledFinish: '2026-08-03T08:00:00+02:00', status: 'proposal' },
  { id: 'cnc', label: 'CNC', stage: 'Megmunkálás', scheduledStart: '2026-08-03T08:00:00+02:00', scheduledFinish: '2026-08-03T10:00:00+02:00', status: 'proposal' },
]

const partialDependency: PlanningVisualDependency = {
  predecessorId: 'cut',
  successorId: 'cnc',
  type: 'SS',
  lagMinutes: -20,
  partialReleasePercent: 0.5,
}

describe('planning visualization view model', () => {
  it('renders only valid server-provided proposal intervals', () => {
    expect(
      buildPlanningGanttLanes([...operations, { ...operations[0], id: 'bad', scheduledFinish: 'not-a-date' }]),
    ).toHaveLength(2)
  })

  it('keeps the four dependency types and audit details visible', () => {
    expect(dependencyLabel(partialDependency)).toBe('SS -20 perc · részleges kiadás 50%')
    expect(dependencyLabel({ predecessorId: 'cut', successorId: 'cnc', type: 'FS', lagMinutes: 0 })).toBe('FS')
  })

  it('takes the wording from formatter props (no baked-in language)', () => {
    expect(
      dependencyLabel(partialDependency, {
        formatLag: (minutes) => `${minutes}m`,
        formatPartialRelease: (ratio) => `${ratio * 100}% released`,
      }),
    ).toBe('SS -20m · 50% released')
  })

  it('does not invent graph edges when a referenced operation is missing', () => {
    const graph = buildPlanningGraph(operations, [
      { predecessorId: 'cut', successorId: 'cnc', type: 'FS', lagMinutes: 0 },
      { predecessorId: 'cut', successorId: 'missing', type: 'FF', lagMinutes: 0 },
    ])
    expect(graph.nodes).toHaveLength(2)
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]?.label).toBe('FS')
    expect(graph.edges[0]?.dashed).toBe(false)
  })

  it('maps the proposal statuses onto the design-system tones', () => {
    expect(PLANNING_STATUS_TONES).toEqual({
      proposal: 'info',
      warning: 'warn',
      published: 'success',
      blocked: 'danger',
    })
    expect(buildPlanningGanttLanes(operations)[0]?.items[0]?.tone).toBe('info')
  })

  it('puts every operation in its own lane and its stage on the bar', () => {
    const lanes = buildPlanningGanttLanes(operations)
    expect(lanes.map((lane) => lane.label)).toEqual(['Szabás', 'CNC'])
    expect(lanes.map((lane) => lane.items[0]?.label)).toEqual(['Szabászat', 'Megmunkálás'])
  })
})

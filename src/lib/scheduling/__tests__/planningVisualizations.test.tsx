/**
 * Átemelve: doorstar-instance `PlanningVisualizations.unit.test.tsx` (PLAN-05 F1).
 * A Doorstar-komponensek helyére a domain-mentes portal-ui primitívek léptek,
 * a nézet-model adapterein keresztül — az eredeti asserteket ez a lánc adja.
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DependencyGraph, GanttChart } from '@spaceos/portal-ui'
import {
  buildPlanningGanttLanes,
  buildPlanningGraph,
  type PlanningVisualOperation,
} from '../planningVisualizationModel'

const operations: PlanningVisualOperation[] = [
  { id: 'cut', label: 'Szabás', stage: 'Szabászat', scheduledStart: '2026-08-03T06:00:00+02:00', scheduledFinish: '2026-08-03T08:00:00+02:00', status: 'proposal' },
  { id: 'cnc', label: 'CNC', stage: 'Megmunkálás', scheduledStart: '2026-08-03T08:00:00+02:00', scheduledFinish: '2026-08-03T10:00:00+02:00', status: 'warning' },
]

describe('Planning visualizations', () => {
  it('renders an accessible Gantt graphic from proposal intervals', () => {
    render(
      <GanttChart
        lanes={buildPlanningGanttLanes(operations)}
        ariaLabel="Tervezési Gantt idősáv"
        emptyLabel="Nincs megjeleníthető, érvényes tervezési időszak."
      />,
    )
    expect(screen.getByRole('img', { name: 'Tervezési Gantt idősáv' })).toBeTruthy()
    expect(screen.getByText('Szabás')).toBeTruthy()
  })

  it('shows the empty message instead of an empty chart', () => {
    render(
      <GanttChart
        lanes={buildPlanningGanttLanes([{ ...operations[0], scheduledFinish: 'not-a-date' }])}
        ariaLabel="Tervezési Gantt idősáv"
        emptyLabel="Nincs megjeleníthető, érvényes tervezési időszak."
      />,
    )
    expect(screen.getByRole('status').textContent).toBe('Nincs megjeleníthető, érvényes tervezési időszak.')
  })

  it('renders graph nodes and the explicit dependency label', () => {
    const { nodes, edges } = buildPlanningGraph(operations, [
      { predecessorId: 'cut', successorId: 'cnc', type: 'FS', lagMinutes: 15 },
    ])
    render(
      <DependencyGraph
        nodes={nodes}
        edges={edges}
        ariaLabel="Munkafolyamat-függőségi háló"
        emptyLabel="Nincs megjeleníthető munkafolyamat."
      />,
    )
    expect(screen.getByRole('img', { name: 'Munkafolyamat-függőségi háló' })).toBeTruthy()
    expect(screen.getAllByText('FS +15 perc')).toHaveLength(2)
  })

  it('carries the proposal status through as a design-system tone', () => {
    const { container } = render(
      <GanttChart
        lanes={buildPlanningGanttLanes(operations)}
        ariaLabel="Tervezési Gantt idősáv"
        emptyLabel="Nincs megjeleníthető, érvényes tervezési időszak."
      />,
    )
    const bars = [...container.querySelectorAll('rect[rx="3"]')]
    expect(bars[0]?.getAttribute('class')).toContain('fill-sky-100') // proposal → info
    expect(bars[1]?.getAttribute('class')).toContain('fill-amber-100') // warning → warn
  })
})

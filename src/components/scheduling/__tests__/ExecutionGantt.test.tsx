/**
 * A korábbi `ExecutionTimeline.test.tsx` utódja (PLAN-05 F1): ugyanazok az
 * elvárások, de a beolvasztott `GanttChart` primitíven keresztül.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutionGantt } from '../ExecutionGantt'
import type { Execution, Machine } from '../../../types/scheduling.types'

const mockMachines: Machine[] = [
  { id: 'machine-1', name: 'Saw Station', type: 'Cutting', capacity: 100, status: 'Available' },
  { id: 'machine-2', name: 'Router', type: 'Routing', capacity: 50, status: 'Busy' },
]

const mockExecutions: Execution[] = [
  {
    id: 'exec-1',
    batchId: 'batch-1',
    batchName: 'Frame Assembly',
    machineId: 'machine-1',
    operatorId: 'op-1',
    priority: 3,
    startTime: '2026-06-17T08:00:00Z',
    estimatedMinutes: 120,
    status: 'Planned',
  },
  {
    id: 'exec-2',
    batchId: 'batch-2',
    batchName: 'Door Cutting',
    machineId: 'machine-1',
    operatorId: 'op-2',
    priority: 7,
    startTime: '2026-06-17T10:30:00Z',
    estimatedMinutes: 90,
    status: 'InProgress',
  },
]

describe('ExecutionGantt', () => {
  it('renders timeline with title and legend', () => {
    render(<ExecutionGantt machines={mockMachines} executions={mockExecutions} planDate="2026-06-17" />)

    expect(screen.getByText('Végrehajtási idősáv')).toBeTruthy()
    expect(screen.getByText('Terv napja: 2026-06-17')).toBeTruthy()
    expect(screen.getByText('Prioritás 1-3')).toBeTruthy()
    expect(screen.getByText('Prioritás 4-6')).toBeTruthy()
    expect(screen.getByText('Prioritás 7-10')).toBeTruthy()
  })

  it('renders all machine rows', () => {
    render(<ExecutionGantt machines={mockMachines} executions={mockExecutions} planDate="2026-06-17" />)

    expect(screen.getByText('Saw Station')).toBeTruthy()
    expect(screen.getByText('Router')).toBeTruthy()
  })

  it('renders execution blocks with correct names', () => {
    render(<ExecutionGantt machines={mockMachines} executions={mockExecutions} planDate="2026-06-17" />)

    expect(screen.getByText('Frame Assembly')).toBeTruthy()
    expect(screen.getByText('Door Cutting')).toBeTruthy()
  })

  it('shows the 24-hour time axis header (hourly grid, 3-hourly labels)', () => {
    const { container } = render(
      <ExecutionGantt machines={mockMachines} executions={mockExecutions} planDate="2026-06-17" />,
    )

    expect(screen.getByText('0:00')).toBeTruthy()
    expect(screen.getByText('12:00')).toBeTruthy()
    expect(screen.getByText('21:00')).toBeTruthy()
    // A felirat nélküli órák is kapnak rácsvonalat (24 óra + a sávok vonalai).
    expect(container.querySelectorAll('line[stroke-dasharray="3 4"]')).toHaveLength(24)
  })

  it('handles empty machines list', () => {
    render(<ExecutionGantt machines={[]} executions={[]} planDate="2026-06-17" />)

    expect(screen.getByText('Nincs elérhető gép')).toBeTruthy()
  })

  it('handles empty executions list', () => {
    render(<ExecutionGantt machines={mockMachines} executions={[]} planDate="2026-06-17" />)

    expect(screen.getByText('Saw Station')).toBeTruthy()
    expect(screen.queryByText('Frame Assembly')).toBeFalsy()
  })

  it('filters executions per machine', () => {
    const multiMachineExecutions: Execution[] = [
      {
        id: 'exec-1',
        batchId: 'batch-1',
        batchName: 'Batch for Machine 1',
        machineId: 'machine-1',
        operatorId: 'op-1',
        priority: 3,
        startTime: '2026-06-17T08:00:00Z',
        estimatedMinutes: 120,
        status: 'Planned',
      },
      {
        id: 'exec-2',
        batchId: 'batch-2',
        batchName: 'Batch for Machine 2',
        machineId: 'machine-2',
        operatorId: 'op-2',
        priority: 5,
        startTime: '2026-06-17T09:00:00Z',
        estimatedMinutes: 60,
        status: 'Planned',
      },
    ]

    render(<ExecutionGantt machines={mockMachines} executions={multiMachineExecutions} planDate="2026-06-17" />)

    expect(screen.getByText('Batch for Machine 1')).toBeTruthy()
    expect(screen.getByText('Batch for Machine 2')).toBeTruthy()
  })

  it('maps priority onto design-system tones instead of hardcoded colors', () => {
    const { container } = render(
      <ExecutionGantt machines={mockMachines} executions={mockExecutions} planDate="2026-06-17" />,
    )

    const bars = [...container.querySelectorAll('rect[rx="3"]')]
    expect(bars[0]?.getAttribute('class')).toContain('fill-emerald-100') // priority 3 → success
    expect(bars[1]?.getAttribute('class')).toContain('fill-rose-100') // priority 7 → danger
    expect(container.querySelector('[style]')).toBeNull()
  })
})

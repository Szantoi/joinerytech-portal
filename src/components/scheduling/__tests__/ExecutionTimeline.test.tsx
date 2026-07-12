import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutionTimeline } from '../ExecutionTimeline'
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

describe('ExecutionTimeline', () => {
  it('renders timeline with title and legend', () => {
    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={mockExecutions}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('Execution Timeline')).toBeTruthy()
    expect(screen.getByText('Plan date: 2026-06-17')).toBeTruthy()
    expect(screen.getByText('Priority 1-3')).toBeTruthy()
    expect(screen.getByText('Priority 4-6')).toBeTruthy()
    expect(screen.getByText('Priority 7-10')).toBeTruthy()
  })

  it('renders all machine rows', () => {
    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={mockExecutions}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('Saw Station')).toBeTruthy()
    expect(screen.getByText('Router')).toBeTruthy()
  })

  it('renders execution blocks with correct names', () => {
    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={mockExecutions}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('Frame Assembly')).toBeTruthy()
    expect(screen.getByText('Door Cutting')).toBeTruthy()
  })

  it('shows 24-hour time header', () => {
    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={mockExecutions}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('0:00')).toBeTruthy()
    expect(screen.getByText('12:00')).toBeTruthy()
    expect(screen.getByText('23:00')).toBeTruthy()
  })

  it('handles empty machines list', () => {
    render(
      <ExecutionTimeline
        machines={[]}
        executions={[]}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('No machines available')).toBeTruthy()
  })

  it('handles empty executions list', () => {
    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={[]}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('Saw Station')).toBeTruthy()
    // No execution blocks should be visible
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

    render(
      <ExecutionTimeline
        machines={mockMachines}
        executions={multiMachineExecutions}
        planDate="2026-06-17"
      />
    )

    expect(screen.getByText('Batch for Machine 1')).toBeTruthy()
    expect(screen.getByText('Batch for Machine 2')).toBeTruthy()
  })
})

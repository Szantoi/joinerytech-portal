import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DependencyGraph, type DependencyGraphNode } from '../DependencyGraph'

const nodes: DependencyGraphNode[] = [
  { id: 'cut', label: 'Szabás', detail: 'Szabászat', lane: 'Szabászat', tone: 'info' },
  { id: 'cnc', label: 'CNC', detail: 'Megmunkálás', lane: 'Megmunkálás', tone: 'warn' },
  { id: 'drill', label: 'Fúrás', detail: 'Megmunkálás', lane: 'Megmunkálás', tone: 'info' },
]

describe('DependencyGraph', () => {
  it('exposes an accessible graphic with node labels and details', () => {
    render(<DependencyGraph nodes={nodes} edges={[]} ariaLabel="Függőségi háló" emptyLabel="Nincs adat" />)
    expect(screen.getByRole('img', { name: 'Függőségi háló' })).toBeTruthy()
    expect(screen.getByText('Szabás')).toBeTruthy()
    expect(screen.getAllByText('Megmunkálás')).toHaveLength(2)
  })

  it('never draws an edge for a missing endpoint', () => {
    const { container } = render(
      <DependencyGraph
        nodes={nodes}
        edges={[
          { fromId: 'cut', toId: 'cnc', label: 'FS' },
          { fromId: 'cut', toId: 'missing', label: 'FF' },
        ]}
        ariaLabel="Függőségi háló"
        emptyLabel="Nincs adat"
      />,
    )
    expect(container.querySelectorAll('path[marker-end]')).toHaveLength(1)
    expect(screen.getAllByText('FS')).toHaveLength(2) // él-felirat + tooltip
    expect(screen.queryByText('FF')).toBeNull()
  })

  it('marks a non-default edge with a dashed line', () => {
    const { container } = render(
      <DependencyGraph
        nodes={nodes}
        edges={[{ fromId: 'cut', toId: 'cnc', label: 'SS', dashed: true }]}
        ariaLabel="Függőségi háló"
        emptyLabel="Nincs adat"
      />,
    )
    expect(container.querySelector('path[marker-end]')?.getAttribute('stroke-dasharray')).toBe('5 4')
  })

  it('places same-lane nodes in one column with the configured sizes', () => {
    const { container } = render(
      <DependencyGraph
        nodes={nodes}
        edges={[]}
        ariaLabel="Függőségi háló"
        emptyLabel="Nincs adat"
        laneWidth={200}
        rowHeight={80}
        nodeWidth={100}
        nodeHeight={40}
      />,
    )
    const rects = [...container.querySelectorAll('rect')]
    const columns = rects.map((rect) => rect.getAttribute('x'))
    // 1. sáv: x = 0; 2. sáv (két csomópont, azonos oszlop): x = 200
    expect(columns).toEqual(['0', '200', '200'])
    const rows = rects.map((rect) => rect.getAttribute('y'))
    expect(rows).toEqual(['16', '16', '96'])
  })

  it('renders the empty label without a graphic', () => {
    render(<DependencyGraph nodes={[]} edges={[]} ariaLabel="Függőségi háló" emptyLabel="Nincs adat" />)
    expect(screen.getByRole('status').textContent).toBe('Nincs adat')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('colors nodes from the tone system, never from a hardcoded value', () => {
    const { container } = render(
      <DependencyGraph nodes={nodes} edges={[]} ariaLabel="Függőségi háló" emptyLabel="Nincs adat" />,
    )
    const node = container.querySelector('rect')
    expect(node?.getAttribute('class')).toContain('fill-sky-100')
    expect(node?.getAttribute('fill')).toBeNull()
    expect(container.querySelector('[style]')).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowStatus, WorkflowStatusTimeline } from '../WorkflowStatus'

describe('WorkflowStatus', () => {
  it('renders design_active state correctly', () => {
    render(<WorkflowStatus currentState="design_active" />)
    expect(screen.getByText('Design aktív')).toBeInTheDocument()
  })

  it('renders cutting_assigned state correctly', () => {
    render(<WorkflowStatus currentState="cutting_assigned" />)
    expect(screen.getByText('Szabászaton hozzárendelve')).toBeInTheDocument()
  })

  it('renders nesting_complete state correctly', () => {
    render(<WorkflowStatus currentState="nesting_complete" />)
    expect(screen.getByText('Nesting kész')).toBeInTheDocument()
  })

  it('renders execution_planned state correctly', () => {
    render(<WorkflowStatus currentState="execution_planned" />)
    expect(screen.getByText('Végrehajtás tervezve')).toBeInTheDocument()
  })

  it('renders completed state correctly', () => {
    render(<WorkflowStatus currentState="completed" />)
    expect(screen.getByText('Befejezett')).toBeInTheDocument()
  })

  it('applies correct size classes for small', () => {
    const { container } = render(<WorkflowStatus currentState="design_active" size="sm" />)
    const badge = container.querySelector('.text-\\[10px\\]')
    expect(badge).toBeInTheDocument()
  })

  it('applies correct size classes for medium', () => {
    const { container } = render(<WorkflowStatus currentState="design_active" size="md" />)
    const badge = container.querySelector('.text-\\[11px\\]')
    expect(badge).toBeInTheDocument()
  })

  it('applies correct size classes for large', () => {
    const { container } = render(<WorkflowStatus currentState="design_active" size="lg" />)
    const badge = container.querySelector('.text-\\[12px\\]')
    expect(badge).toBeInTheDocument()
  })
})

describe('WorkflowStatusTimeline', () => {
  it('renders all workflow states', () => {
    render(<WorkflowStatusTimeline currentState="cutting_assigned" />)

    // All states should be rendered (some may be abbreviated on mobile)
    expect(screen.getByText(/Design aktív/i)).toBeInTheDocument()
    expect(screen.getByText(/Szabászaton hozzárendelve/i)).toBeInTheDocument()
    expect(screen.getByText(/Nesting kész/i)).toBeInTheDocument()
    expect(screen.getByText(/Végrehajtás tervezve/i)).toBeInTheDocument()
    expect(screen.getByText(/Befejezett/i)).toBeInTheDocument()
  })

  it('highlights current state', () => {
    const { container } = render(<WorkflowStatusTimeline currentState="nesting_complete" />)
    
    // Current state should have teal color
    const currentStateBadge = screen.getByText(/Nesting kész/i).closest('div')
    expect(currentStateBadge?.className).toContain('text-teal-700')
  })

  it('marks completed states with check icon', () => {
    const { container } = render(<WorkflowStatusTimeline currentState="execution_planned" />)
    
    // Previous states should show completed styling
    // We can check for emerald color which indicates completion
    const completedBadges = container.querySelectorAll('.bg-emerald-100')
    expect(completedBadges.length).toBeGreaterThanOrEqual(3) // design, cutting, nesting should be complete
  })
})

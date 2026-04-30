import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KpiCard } from '../KpiCard'

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Bevétel" value="12.4M Ft" />)
    expect(screen.getByText('Bevétel')).toBeTruthy()
    expect(screen.getByText('12.4M Ft')).toBeTruthy()
  })

  it('renders change indicator', () => {
    render(<KpiCard title="T" value="1" change="+12%" changeDirection="up" />)
    expect(screen.getByText('+12%')).toBeTruthy()
  })

  it('renders sparkline when provided', () => {
    const { container } = render(<KpiCard title="T" value="1" spark={[1, 2, 3]} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('shows breakdowns on click', () => {
    render(
      <KpiCard
        title="T"
        value="1"
        breakdowns={[{ label: 'Sub A', value: '10' }]}
      />
    )
    fireEvent.click(screen.getByText('Részletek'))
    expect(screen.getByText('Sub A')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })

  it('toggles breakdowns visibility', () => {
    render(
      <KpiCard
        title="T"
        value="1"
        breakdowns={[{ label: 'Item', value: '5' }]}
      />
    )
    fireEvent.click(screen.getByText('Részletek'))
    expect(screen.getByText('Item')).toBeTruthy()
    fireEvent.click(screen.getByText('Bezárás'))
    expect(screen.queryByText('Item')).toBeNull()
  })
})

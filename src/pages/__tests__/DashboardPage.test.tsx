import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '../DashboardPage'

describe('DashboardPage', () => {
  it('renders greeting', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/Jó reggelt/)).toBeTruthy()
  })

  it('renders KPI cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Aktív projektek')).toBeTruthy()
  })

  it('renders today plan section', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Mai gyártási terv')).toBeTruthy()
  })

  it('renders recent orders section', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Utolsó rendelések')).toBeTruthy()
  })

  it('renders active machines section', () => {
    render(<DashboardPage />)
    const matches = screen.getAllByText(/gép aktív/)
    expect(matches.length).toBeGreaterThan(0)
  })
})

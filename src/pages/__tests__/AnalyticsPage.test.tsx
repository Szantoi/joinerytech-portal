import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsPage } from '../AnalyticsPage'

describe('AnalyticsPage', () => {
  it('renders waste metric placeholder when no API data', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders capacity metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('82%')).toBeTruthy()
  })

  it('renders OEE metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('81%')).toBeTruthy()
  })

  it('renders daily output metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('284')).toBeTruthy()
  })

  it('renders machine waste section heading', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText(/Gép-szintű hulladék/)).toBeTruthy()
  })

  it('machine waste section shows endpoint pending banner', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Backend endpoint nem elérhető')).toBeTruthy()
  })

  it('renders period selector', () => {
    render(<AnalyticsPage />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renders CSV export button', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('CSV')).toBeTruthy()
  })
})

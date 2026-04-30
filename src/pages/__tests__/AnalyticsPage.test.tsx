import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsPage } from '../AnalyticsPage'

describe('AnalyticsPage', () => {
  it('renders title', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Elemzések')).toBeTruthy()
  })

  it('renders waste metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('8.2%')).toBeTruthy()
  })

  it('renders capacity metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('76%')).toBeTruthy()
  })

  it('renders OEE metric', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('68.4%')).toBeTruthy()
  })

  it('renders export button', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Exportálás')).toBeTruthy()
  })
})

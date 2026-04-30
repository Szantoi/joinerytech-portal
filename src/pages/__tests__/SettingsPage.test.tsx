import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPage } from '../SettingsPage'

describe('SettingsPage', () => {
  it('renders title', () => {
    render(<SettingsPage />)
    expect(screen.getByText(/Be\u00e1ll\u00edt\u00e1sok/)).toBeTruthy()
  })

  it('renders general tab by default', () => {
    render(<SettingsPage />)
    expect(screen.getByDisplayValue('Doorstar Hungary Zrt.')).toBeTruthy()
  })

  it('switches to users tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Felhaszn/))
    expect(screen.getByText(/Kov\u00e1cs/)).toBeTruthy()
  })

  it('switches to roles tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Jogosults/))
    const matches = screen.getAllByText('Teljes')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('switches to facilities tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Telephely'))
    expect(screen.getByText(/c \u2014 f/)).toBeTruthy()
  })

  it('switches to machines tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/ppark/))
    expect(screen.getByText('Holzma HPP380')).toBeTruthy()
  })

  it('switches to partners tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Partnerek/))
    expect(screen.getByText(/Egger/)).toBeTruthy()
  })

  it('switches to audit tab', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText(/Audit/))
    expect(screen.getByText('order.create')).toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DesignPage } from '../DesignPage'

describe('DesignPage', () => {
  it('renders title', () => {
    render(<DesignPage />)
    expect(screen.getByText(/Tervez/)).toBeTruthy()
  })

  it('renders template cards', () => {
    render(<DesignPage />)
    expect(screen.getByText(/Als\u00f3 konyha/)).toBeTruthy()
  })

  it('switches to catalog tab', () => {
    render(<DesignPage />)
    fireEvent.click(screen.getByText(/Katal\u00f3gus/))
    expect(screen.getByText(/Anyag katal/)).toBeTruthy()
  })

  it('switches to editor tab', () => {
    render(<DesignPage />)
    fireEvent.click(screen.getByText(/Szerkeszt/))
    expect(screen.getByText(/Alkatr\u00e9sz/)).toBeTruthy()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomeScreen } from '../HomeScreen'

describe('HomeScreen', () => {
  it('renders greeting', () => {
    render(<HomeScreen onEnter={vi.fn()} />)
    expect(screen.getByText(/J\u00f3 reggelt/)).toBeTruthy()
  })

  it('renders world cards', () => {
    render(<HomeScreen onEnter={vi.fn()} />)
    expect(screen.getByText('Gy\u00e1rt\u00e1s')).toBeTruthy()
    expect(screen.getByText('\u00c9rt\u00e9kes\u00edt\u00e9s')).toBeTruthy()
  })

  it('renders recent activity', () => {
    render(<HomeScreen onEnter={vi.fn()} />)
    expect(screen.getByText('Legut\u00f3bbi tev\u00e9kenys\u00e9g')).toBeTruthy()
  })

  it('calls onEnter when world card is clicked', () => {
    const fn = vi.fn()
    render(<HomeScreen onEnter={fn} />)
    fireEvent.click(screen.getByText('Gy\u00e1rt\u00e1s'))
    expect(fn).toHaveBeenCalledWith('production')
  })

  it('renders user info', () => {
    render(<HomeScreen onEnter={vi.fn()} />)
    const matches = screen.getAllByText(/Kov\u00e1cs P\u00e9ter/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders version footer', () => {
    render(<HomeScreen onEnter={vi.fn()} />)
    expect(screen.getByText(/v3\.2\.1/)).toBeTruthy()
  })
})

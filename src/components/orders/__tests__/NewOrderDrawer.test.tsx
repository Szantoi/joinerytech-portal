import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NewOrderDrawer } from '../NewOrderDrawer'

describe('NewOrderDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<NewOrderDrawer open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders drawer title when open', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Új rendelés')).toBeTruthy()
  })

  it('renders type selector buttons', () => {
    render(<NewOrderDrawer open={true} onClose={() => {}} />)
    expect(screen.getByText('Ajtó')).toBeTruthy()
    expect(screen.getByText('Szekrény')).toBeTruthy()
  })

  it('calls onClose when Mégse clicked', () => {
    const onClose = vi.fn()
    render(<NewOrderDrawer open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Mégse'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

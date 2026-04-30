import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileBottomNav } from '../MobileBottomNav'
import { I18N } from '../../../mocks/data'

describe('MobileBottomNav', () => {
  const t = I18N.hu

  it('renders four nav items', () => {
    render(<MobileBottomNav current="dashboard" onNav={vi.fn()} t={t} />)
    expect(screen.getByText('Irányítópult')).toBeTruthy()
    expect(screen.getByText('Munkafolyamat')).toBeTruthy()
    expect(screen.getByText('Gyártás')).toBeTruthy()
    expect(screen.getByText('Beállítások')).toBeTruthy()
  })

  it('calls onNav on click', () => {
    const fn = vi.fn()
    render(<MobileBottomNav current="dashboard" onNav={fn} t={t} />)
    fireEvent.click(screen.getByText('Gyártás'))
    expect(fn).toHaveBeenCalledWith('production')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileBottomNav } from '../MobileBottomNav'
import type { WorldScreen } from '../../../types'

const FEW_SCREENS: WorldScreen[] = [
  { key: 'dash', hu: 'Áttekintés', en: 'Overview' },
  { key: 'incidents', hu: 'Balesetek' },
  { key: 'risks', hu: 'Kockázatok' },
]

const MANY_SCREENS: WorldScreen[] = [
  { key: 'dash', hu: 'Áttekintés' },
  { key: 'leads', hu: 'Leadek' },
  { key: 'opps', hu: 'Lehetőségek' },
  { key: 'pipeline', hu: 'Pipeline' },
  { key: 'forecast', hu: 'Forecast' },
  { key: 'customers', hu: 'Ügyfelek' },
]

function renderNav(props: Partial<React.ComponentProps<typeof MobileBottomNav>> = {}) {
  const defaults = {
    screens: FEW_SCREENS,
    active: 'dash',
    onScreen: vi.fn(),
    onMore: vi.fn(),
    moreOpen: false,
  }
  const merged = { ...defaults, ...props }
  render(<MobileBottomNav {...merged} />)
  return merged
}

describe('MobileBottomNav', () => {
  it('renders a labelled nav landmark', () => {
    renderNav()
    expect(screen.getByRole('navigation', { name: 'Fő navigáció' })).toBeTruthy()
  })

  it('renders every screen as a tab when they fit (no "Több")', () => {
    renderNav()
    expect(screen.getByText('Áttekintés')).toBeTruthy()
    expect(screen.getByText('Balesetek')).toBeTruthy()
    expect(screen.getByText('Kockázatok')).toBeTruthy()
    expect(screen.queryByText('Több')).toBeNull()
  })

  it('marks the active tab with aria-current="page"', () => {
    renderNav({ active: 'incidents' })
    const active = screen.getByText('Balesetek').closest('button')!
    expect(active.getAttribute('aria-current')).toBe('page')
    const inactive = screen.getByText('Áttekintés').closest('button')!
    expect(inactive.getAttribute('aria-current')).toBeNull()
  })

  it('navigates via onScreen on tab click', () => {
    const { onScreen } = renderNav()
    fireEvent.click(screen.getByText('Kockázatok'))
    expect(onScreen).toHaveBeenCalledWith('risks')
  })

  it('shows max 4 tabs + "Több" when there are more than 5 screens', () => {
    renderNav({ screens: MANY_SCREENS })
    expect(screen.getByText('Pipeline')).toBeTruthy()
    // overflow screens are not direct tabs
    expect(screen.queryByText('Forecast')).toBeNull()
    expect(screen.queryByText('Ügyfelek')).toBeNull()
    expect(screen.getByText('Több')).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('"Több" opens the drawer and carries dialog popup semantics', () => {
    const { onMore } = renderNav({ screens: MANY_SCREENS })
    const more = screen.getByText('Több').closest('button')!
    expect(more.getAttribute('aria-haspopup')).toBe('dialog')
    expect(more.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(more)
    expect(onMore).toHaveBeenCalledTimes(1)
  })

  it('"Több" reflects the open drawer via aria-expanded', () => {
    renderNav({ screens: MANY_SCREENS, moreOpen: true })
    const more = screen.getByText('Több').closest('button')!
    expect(more.getAttribute('aria-expanded')).toBe('true')
  })

  it('uses the English labels when lang="en"', () => {
    renderNav({ lang: 'en' })
    expect(screen.getByText('Overview')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy()
  })

  it('renders nothing for a world without screens', () => {
    renderNav({ screens: [] })
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})

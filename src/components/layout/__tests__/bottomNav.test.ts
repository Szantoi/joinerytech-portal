import { describe, it, expect } from 'vitest'
import {
  selectBottomNavItems,
  screenIcon,
  MAX_BOTTOM_NAV_TABS,
  SCREEN_ICON_MAP,
  BOTTOM_NAV_FALLBACK_ICON,
} from '../bottomNav'
import type { WorldScreen } from '../../../types'

/** Helper: n dummy screens (s1…sn). */
function screens(n: number): WorldScreen[] {
  return Array.from({ length: n }, (_, i) => ({ key: `s${i + 1}`, hu: `Képernyő ${i + 1}` }))
}

describe('selectBottomNavItems (spec §3.1: max 5 fül + "Több")', () => {
  it('few screens → every screen is a direct tab, no "Több"', () => {
    const sel = selectBottomNavItems(screens(3), 's1')
    expect(sel.tabs.map((s) => s.key)).toEqual(['s1', 's2', 's3'])
    expect(sel.overflow).toEqual([])
    expect(sel.hasMore).toBe(false)
    expect(sel.moreActive).toBe(false)
  })

  it('exactly MAX tabs → all direct, still no "Több"', () => {
    const sel = selectBottomNavItems(screens(MAX_BOTTOM_NAV_TABS), 's5')
    expect(sel.tabs).toHaveLength(MAX_BOTTOM_NAV_TABS)
    expect(sel.hasMore).toBe(false)
  })

  it('more than MAX → first (MAX−1) tabs + "Több" overflow with the rest', () => {
    const sel = selectBottomNavItems(screens(8), 's1')
    expect(sel.tabs.map((s) => s.key)).toEqual(['s1', 's2', 's3', 's4'])
    expect(sel.overflow.map((s) => s.key)).toEqual(['s5', 's6', 's7', 's8'])
    expect(sel.hasMore).toBe(true)
  })

  it('never renders more than MAX slots (tabs + "Több")', () => {
    const sel = selectBottomNavItems(screens(20), 's1')
    expect(sel.tabs.length + 1).toBeLessThanOrEqual(MAX_BOTTOM_NAV_TABS)
  })

  it('active screen in the overflow → "Több" is tinted active', () => {
    const sel = selectBottomNavItems(screens(8), 's7')
    expect(sel.moreActive).toBe(true)
  })

  it('active screen among the tabs → "Több" is not active', () => {
    const sel = selectBottomNavItems(screens(8), 's2')
    expect(sel.moreActive).toBe(false)
  })

  it('empty screen list → empty selection', () => {
    const sel = selectBottomNavItems([], 'anything')
    expect(sel.tabs).toEqual([])
    expect(sel.hasMore).toBe(false)
  })

  it('respects a custom maxTabs', () => {
    const sel = selectBottomNavItems(screens(5), 's5', 3)
    expect(sel.tabs.map((s) => s.key)).toEqual(['s1', 's2'])
    expect(sel.overflow).toHaveLength(3)
    expect(sel.hasMore).toBe(true)
    expect(sel.moreActive).toBe(true)
  })
})

describe('screenIcon', () => {
  it('resolves mapped keys from the config', () => {
    expect(screenIcon('dash')).toBe(SCREEN_ICON_MAP.dash)
    expect(screenIcon('workflow')).toBe('workflow')
  })

  it('falls back for unknown keys', () => {
    expect(screenIcon('nonexistent-screen')).toBe(BOTTOM_NAV_FALLBACK_ICON)
  })
})

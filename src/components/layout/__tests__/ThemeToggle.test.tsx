/**
 * ThemeToggle + ThemeQuickToggle tesztek (DS-DARKMODE).
 *
 * Spec: design-system/dark-mode.html — háromállású választó (rendszer /
 * világos / sötét) localStorage-perzisztenciával, gyors header-kapcsoló
 * nap/hold/monitor ikonnal és aria-label-lel; a <html> data-theme attribútuma
 * csak explicit light/dark esetén létezik.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeToggle, ThemeQuickToggle } from '../ThemeToggle'
import { setThemePreference, THEME_STORAGE_KEY } from '../../../theme/useTheme'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  act(() => setThemePreference('system'))
})

describe('ThemeToggle — háromállású választó', () => {
  it('radiogroup, a kiválasztás perzisztál és data-theme attribútumot állít', () => {
    render(<ThemeToggle />)
    const group = screen.getByRole('radiogroup', { name: 'Téma' })
    expect(group).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Sötét' }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Sötét' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: 'Világos' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('Rendszer választásakor NINCS data-theme attribútum (a CSS media query dönt)', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('radio', { name: 'Sötét' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Rendszer' }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})

describe('ThemeQuickToggle — gyors kapcsoló a headerben', () => {
  it('a rendszer → világos → sötét → rendszer cikluson lép, aria-label-lel', () => {
    render(<ThemeQuickToggle />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-label')).toContain('Téma: rendszer')

    fireEvent.click(btn) // rendszer → világos
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(btn.getAttribute('aria-label')).toContain('Téma: világos')

    fireEvent.click(btn) // világos → sötét
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    fireEvent.click(btn) // sötét → rendszer
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })
})

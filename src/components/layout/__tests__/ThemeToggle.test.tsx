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
import { setThemePreference, THEME_STORAGE_KEY } from '@spaceos/portal-ui'

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

  // ── WAI-ARIA radiogroup minta (F1-A11Y-RESIDUALS / F1-REVIEW N1) ────────────

  it('roving tabindex: csak a kiválasztott radio tabbolható', () => {
    render(<ThemeToggle />)
    // beforeEach: 'system' a kiválasztott.
    expect(screen.getByRole('radio', { name: 'Rendszer' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Világos' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('radio', { name: 'Sötét' })).toHaveAttribute('tabindex', '-1')

    fireEvent.click(screen.getByRole('radio', { name: 'Sötét' }))
    expect(screen.getByRole('radio', { name: 'Sötét' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Rendszer' })).toHaveAttribute('tabindex', '-1')
  })

  it('a nyíl léptet ÉS kiválaszt, a fókusz a kiválasztottra kerül', () => {
    render(<ThemeToggle />)
    const system = screen.getByRole('radio', { name: 'Rendszer' })
    system.focus()

    // system (3.) → ArrowRight → körbefordul az 1.-re (Világos).
    fireEvent.keyDown(system, { key: 'ArrowRight' })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByRole('radio', { name: 'Világos' })).toHaveAttribute('aria-checked', 'true')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Világos' }))

    // Világos → ArrowLeft → vissza a Rendszerre (körbe, visszafelé).
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Világos' }), { key: 'ArrowLeft' })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Rendszer' }))
  })

  it('a le/fel nyíl is léptet (WAI-ARIA: mind a négy nyíl él)', () => {
    render(<ThemeToggle />)
    const system = screen.getByRole('radio', { name: 'Rendszer' })
    system.focus()

    fireEvent.keyDown(system, { key: 'ArrowUp' })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Sötét' }))
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

/**
 * Téma-kezelés tesztek (F1-A / DESIGN_SYSTEM_SPEC_V1 4.1).
 *
 * Mechanizmus: data-theme attribútum (design-system/dark-mode.html).
 * A useTheme module-szintű state-et tart (localStorage + matchMedia), ezért
 * minden teszt friss module-példánnyal indul (vi.resetModules + dynamic import),
 * kontrollált matchMedia-mockkal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

type MediaListener = (e: { matches: boolean }) => void

/** Kontrollálható matchMedia-mock: állítható `matches` + change-esemény kilövés. */
function mockMatchMedia(initialDark: boolean) {
  const listeners = new Set<MediaListener>()
  const state = { matches: initialDark }
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: state.matches,
    media: query,
    addEventListener: (_: string, cb: MediaListener) => listeners.add(cb),
    removeEventListener: (_: string, cb: MediaListener) => listeners.delete(cb),
  })) as unknown as typeof window.matchMedia
  return {
    setSystemDark(dark: boolean) {
      state.matches = dark
      listeners.forEach((cb) => cb({ matches: dark }))
    },
  }
}

async function importTheme() {
  return await import('../useTheme')
}

beforeEach(() => {
  vi.resetModules()
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme — preferencia és perzisztencia', () => {
  it('tárolt érték nélkül a preferencia "system"', async () => {
    mockMatchMedia(false)
    const { getThemePreference } = await importTheme()
    expect(getThemePreference()).toBe('system')
  })

  it('a tárolt jt-theme értéket olvassa be', async () => {
    mockMatchMedia(false)
    window.localStorage.setItem('jt-theme', 'dark')
    const { getThemePreference } = await importTheme()
    expect(getThemePreference()).toBe('dark')
  })

  it('érvénytelen tárolt érték → system (nem dob)', async () => {
    mockMatchMedia(false)
    window.localStorage.setItem('jt-theme', 'bogus')
    const { getThemePreference } = await importTheme()
    expect(getThemePreference()).toBe('system')
  })

  it('setThemePreference perzisztál és állítja a data-theme attribútumot', async () => {
    mockMatchMedia(false)
    const { setThemePreference, THEME_STORAGE_KEY } = await importTheme()

    setThemePreference('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    setThemePreference('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('useTheme — system mód', () => {
  it('resolveIsDark: dark → true, light → false, system → OS-preferencia', async () => {
    mockMatchMedia(true)
    const { resolveIsDark } = await importTheme()
    expect(resolveIsDark('dark', false)).toBe(true)
    expect(resolveIsDark('light', true)).toBe(false)
    expect(resolveIsDark('system', true)).toBe(true)
    expect(resolveIsDark('system', false)).toBe(false)
  })

  it('system módban NINCS data-theme attribútum — a CSS media query dönt', async () => {
    mockMatchMedia(false)
    const { setThemePreference } = await importTheme()

    act(() => setThemePreference('dark'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    act(() => setThemePreference('system'))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('system módban az OS-váltást (change esemény) élőben követi (isDark)', async () => {
    const media = mockMatchMedia(false)
    const { setThemePreference, resolveIsDark, getThemePreference } = await importTheme()

    act(() => setThemePreference('system'))
    expect(resolveIsDark(getThemePreference())).toBe(false)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)

    act(() => media.setSystemDark(true))
    expect(resolveIsDark(getThemePreference())).toBe(true)
    // az attribútum system módban akkor sem jelenik meg — a CSS ága vált
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('explicit light/dark módban az OS-váltás NEM ír felül', async () => {
    const media = mockMatchMedia(false)
    const { setThemePreference } = await importTheme()

    act(() => setThemePreference('light'))
    act(() => media.setSystemDark(true))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('useTheme — React hook', () => {
  it('a hook követi a preferencia-váltást és isDark-ot ad', async () => {
    mockMatchMedia(false)
    const { useTheme } = await importTheme()
    const { result } = renderHook(() => useTheme())

    expect(result.current.preference).toBe('system')
    expect(result.current.isDark).toBe(false)

    act(() => result.current.setPreference('dark'))
    expect(result.current.preference).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

/**
 * Téma-kezelés tesztek (F1-A / DESIGN_SYSTEM_SPEC_V1 4.1).
 *
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
  document.documentElement.classList.remove('dark')
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

  it('setThemePreference perzisztál és állítja a .dark class-t', async () => {
    mockMatchMedia(false)
    const { setThemePreference, THEME_STORAGE_KEY } = await importTheme()

    setThemePreference('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    setThemePreference('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
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

  it('system módban az OS-váltást (change esemény) élőben követi', async () => {
    const media = mockMatchMedia(false)
    const { setThemePreference } = await importTheme()

    act(() => setThemePreference('system'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => media.setSystemDark(true))
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => media.setSystemDark(false))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('explicit light/dark módban az OS-váltás NEM ír felül', async () => {
    const media = mockMatchMedia(false)
    const { setThemePreference } = await importTheme()

    act(() => setThemePreference('light'))
    act(() => media.setSystemDark(true))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
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
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

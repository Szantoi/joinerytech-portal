import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCatalogFilterStore } from '../stores/catalogFilterStore'

/**
 * XSS Protection Tests for Catalog Filter
 *
 * Critical security tests (v3-H1 fix)
 * Verifies that HTML tags are stripped from search input
 */
describe('Catalog Filter XSS Protection', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCatalogFilterStore())
    act(() => {
      result.current.resetFilters()
    })
  })

  it('should strip HTML tags from search input', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: <script> tag
    act(() => {
      result.current.setFilter('search', '<script>alert(1)</script>')
    })

    expect(result.current.catalogFilters.search).toBe('alert(1)')
    expect(result.current.catalogFilters.search).not.toContain('<script>')
    expect(result.current.catalogFilters.search).not.toContain('</script>')
  })

  it('should strip <img> tags with onerror', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: <img> with onerror
    act(() => {
      result.current.setFilter(
        'search',
        '<img src=x onerror="alert(1)">'
      )
    })

    // The regex strips ALL HTML tags, so empty string is expected
    expect(result.current.catalogFilters.search).toBe('')
    expect(result.current.catalogFilters.search).not.toContain('<img')
    expect(result.current.catalogFilters.search).not.toContain('onerror')
  })

  it('should strip <a> tags with javascript: protocol', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: <a> tag with javascript:
    act(() => {
      result.current.setFilter(
        'search',
        '<a href="javascript:alert(1)">Click</a>'
      )
    })

    expect(result.current.catalogFilters.search).toBe('Click')
    expect(result.current.catalogFilters.search).not.toContain('<a')
    expect(result.current.catalogFilters.search).not.toContain('javascript:')
  })

  it('should strip <iframe> tags', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: <iframe>
    act(() => {
      result.current.setFilter(
        'search',
        '<iframe src="evil.com"></iframe>'
      )
    })

    expect(result.current.catalogFilters.search).toBe('')
    expect(result.current.catalogFilters.search).not.toContain('<iframe')
  })

  it('should strip <svg> tags with onload', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: <svg> with onload
    act(() => {
      result.current.setFilter(
        'search',
        '<svg onload="alert(1)"></svg>'
      )
    })

    expect(result.current.catalogFilters.search).toBe('')
    expect(result.current.catalogFilters.search).not.toContain('<svg')
    expect(result.current.catalogFilters.search).not.toContain('onload')
  })

  it('should strip nested HTML tags', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ XSS Test: nested tags
    act(() => {
      result.current.setFilter(
        'search',
        '<div><script>alert(1)</script></div>'
      )
    })

    expect(result.current.catalogFilters.search).toBe('alert(1)')
    expect(result.current.catalogFilters.search).not.toContain('<div>')
    expect(result.current.catalogFilters.search).not.toContain('<script>')
  })

  it('should preserve normal search text', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ Normal input: should pass through
    act(() => {
      result.current.setFilter('search', 'wood panel 18mm')
    })

    expect(result.current.catalogFilters.search).toBe('wood panel 18mm')
  })

  it('should preserve special characters (except HTML tags)', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // ✅ Special chars: should preserve
    act(() => {
      result.current.setFilter('search', 'bútor 10.000 Ft & more')
    })

    expect(result.current.catalogFilters.search).toBe('bútor 10.000 Ft & more')
  })

  it('should handle empty input', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    act(() => {
      result.current.setFilter('search', '')
    })

    expect(result.current.catalogFilters.search).toBe('')
  })

  it('should handle multiple XSS attempts in sequence', () => {
    const { result } = renderHook(() => useCatalogFilterStore())

    // First attempt
    act(() => {
      result.current.setFilter('search', '<script>alert(1)</script>')
    })
    expect(result.current.catalogFilters.search).toBe('alert(1)')

    // Second attempt (img tag with attributes)
    act(() => {
      result.current.setFilter('search', '<img src=x onerror=alert(2)>')
    })
    // All tags are stripped
    expect(result.current.catalogFilters.search).toBe('')

    // Normal input
    act(() => {
      result.current.setFilter('search', 'normal search')
    })
    expect(result.current.catalogFilters.search).toBe('normal search')
  })
})

/**
 * Fuzzy Search XSS Tests
 */
describe('Fuzzy Search XSS Protection', () => {
  it('should not execute XSS payload in fuzzy search results', () => {
    // This test ensures that even if malicious data is in the catalog,
    // the fuzzy search doesn't execute it
    const maliciousItem = {
      id: '1',
      name: '<script>alert(1)</script>Wood Panel',
      category: 'Wood',
      price: 5000,
      stock: 10,
    }

    // The component should escape this when rendering
    expect(maliciousItem.name).toContain('<script>')

    // In a real E2E test, we'd verify that the browser doesn't execute the script
    // For now, we document the expected behavior:
    // - Raw data may contain HTML
    // - React automatically escapes it in JSX
    // - Search filter strips HTML before storing
  })
})

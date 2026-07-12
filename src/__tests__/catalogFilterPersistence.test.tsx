import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCatalogFilterStore } from '../stores/catalogFilterStore'

/**
 * Feature 2: Catalog Filter Persistence Tests
 *
 * Verifies:
 * - localStorage save with 300ms debounce
 * - localStorage load on page init
 * - BroadcastChannel multi-tab sync
 * - sessionStorage fallback on quota exceeded
 * - 24h expiry check
 * - Versioned storage (v2)
 */

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
  }

  postMessage(data: any) {
    // Mock implementation - just store the message
  }

  close() {
    // Mock cleanup
  }
}

(globalThis as any).BroadcastChannel = MockBroadcastChannel

describe('Catalog Filter Persistence - Feature 2', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    // Reset store
    const { result } = renderHook(() => useCatalogFilterStore())
    act(() => {
      result.current.clearFilters()
    })

    // Clear all timers
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('✅ saves filters to localStorage after 300ms debounce', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useCatalogFilterStore())

    // Set filters
    act(() => {
      result.current.setFilters({
        search: 'oak panel',
        category: ['wood'],
        priceRange: [1000, 5000],
        stockStatus: 'in-stock'
      })
    })

    // Immediately check - should NOT be saved yet
    expect(localStorage.getItem('spaceos_catalog_v2')).toBeNull()

    // Advance timers by 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Now it should be saved
    const saved = localStorage.getItem('spaceos_catalog_v2')
    expect(saved).not.toBeNull()

    if (saved) {
      const parsed = JSON.parse(saved)
      expect(parsed.filters.search).toBe('oak panel')
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.version).toBe(2)
    }

    vi.useRealTimers()
  })

  it('✅ debounce: multiple rapid changes only save once', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useCatalogFilterStore())

    // Rapid filter changes
    act(() => {
      result.current.setFilter('search', 'oak')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      result.current.setFilter('search', 'oak panel')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      result.current.setFilter('search', 'oak panel 18mm')
    })

    // Not saved yet (only 200ms passed)
    expect(localStorage.getItem('spaceos_catalog_v2')).toBeNull()

    // Advance final 100ms (total 300ms from last change)
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now saved with latest value
    const saved = localStorage.getItem('spaceos_catalog_v2')
    expect(saved).not.toBeNull()

    if (saved) {
      const parsed = JSON.parse(saved)
      expect(parsed.filters.search).toBe('oak panel 18mm')
    }

    vi.useRealTimers()
  })

  it('✅ loads filters from localStorage on init', () => {
    // Pre-populate localStorage
    const mockData = {
      filters: {
        search: 'birch plywood',
        category: ['plywood'],
        priceRange: [2000, 8000],
        stockStatus: 'all'
      },
      viewMode: 'list',
      timestamp: Date.now(),
      version: 2
    }

    localStorage.setItem('spaceos_catalog_v2', JSON.stringify(mockData))

    const { result } = renderHook(() => useCatalogFilterStore())

    // Load filters
    const loaded = result.current.loadFilters()

    expect(loaded).not.toBeNull()
    expect(loaded?.filters.search).toBe('birch plywood')
    expect(loaded?.viewMode).toBe('list')
  })

  it('✅ 24h expiry: expired filters return null', () => {
    // Pre-populate with expired data (25 hours ago)
    const expired = {
      filters: {
        search: 'old search',
        category: [],
        priceRange: [0, 100000],
        stockStatus: 'all'
      },
      viewMode: 'grid',
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      version: 2
    }

    localStorage.setItem('spaceos_catalog_v2', JSON.stringify(expired))

    const { result } = renderHook(() => useCatalogFilterStore())

    const loaded = result.current.loadFilters()

    // Should return null and clear storage
    expect(loaded).toBeNull()
    expect(localStorage.getItem('spaceos_catalog_v2')).toBeNull()
  })

  it('✅ sessionStorage fallback: falls back when localStorage quota exceeded', async () => {
    vi.useFakeTimers()

    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'
      throw error
    })

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useCatalogFilterStore())

    act(() => {
      result.current.setFilters({
        search: 'test',
        category: [],
        priceRange: [0, 100000],
        stockStatus: 'all'
      })
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should have fallen back to sessionStorage
    const savedSession = sessionStorage.getItem('spaceos_catalog_v2')
    expect(savedSession).not.toBeNull()

    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage quota exceeded')
    )

    // Restore
    localStorage.setItem = originalSetItem
    consoleSpy.mockRestore()
    vi.useRealTimers()
  })

  it('✅ large data: uses sessionStorage for >50KB data', async () => {
    vi.useFakeTimers()

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useCatalogFilterStore())

    // Create large filter data (>50KB)
    const largeCategories = Array.from({ length: 5000 }, (_, i) => `category-${i}`)

    act(() => {
      result.current.setFilters({
        search: 'test',
        category: largeCategories,
        priceRange: [0, 100000],
        stockStatus: 'all'
      })
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should use sessionStorage for large data
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage quota near limit')
    )

    consoleSpy.mockRestore()
    vi.useRealTimers()
  })

  it('✅ viewMode: saves and loads grid/list mode', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useCatalogFilterStore())

    act(() => {
      result.current.setViewMode('list')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    const saved = localStorage.getItem('spaceos_catalog_v2')
    expect(saved).not.toBeNull()

    if (saved) {
      const parsed = JSON.parse(saved)
      expect(parsed.viewMode).toBe('list')
    }

    // Clear and reload
    act(() => {
      result.current.clearFilters()
    })

    // Re-populate and load
    const loaded = result.current.loadFilters()
    expect(loaded?.viewMode).toBe('grid') // Default after clear

    vi.useRealTimers()
  })

  it('✅ versioning: ignores old version data', () => {
    // Pre-populate with v1 data (old version)
    const oldVersion = {
      filters: { search: 'old' },
      timestamp: Date.now(),
      version: 1 // Old version
    }

    localStorage.setItem('spaceos_catalog_v1', JSON.stringify(oldVersion))

    const { result } = renderHook(() => useCatalogFilterStore())

    const loaded = result.current.loadFilters()

    // Should not load v1 data (store uses v2)
    expect(loaded).toBeNull()
  })

  it('✅ clearFilters: removes both localStorage and sessionStorage', () => {
    // Populate both storages
    localStorage.setItem('spaceos_catalog_v2', JSON.stringify({ test: 'data' }))
    sessionStorage.setItem('spaceos_catalog_v2', JSON.stringify({ test: 'data' }))

    const { result } = renderHook(() => useCatalogFilterStore())

    act(() => {
      result.current.clearFilters()
    })

    // Both should be cleared
    expect(localStorage.getItem('spaceos_catalog_v2')).toBeNull()
    expect(sessionStorage.getItem('spaceos_catalog_v2')).toBeNull()

    // Filters should be reset to defaults
    expect(result.current.catalogFilters.search).toBe('')
    expect(result.current.viewMode).toBe('grid')
  })

  it('✅ BroadcastChannel: broadcasts filter updates', async () => {
    vi.useFakeTimers()

    const bcSpy = vi.spyOn(MockBroadcastChannel.prototype, 'postMessage')

    const { result } = renderHook(() => useCatalogFilterStore())

    act(() => {
      result.current.setFilters({
        search: 'walnut',
        category: [],
        priceRange: [0, 100000],
        stockStatus: 'all'
      })
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Verify BroadcastChannel.postMessage was called
    expect(bcSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FILTER_UPDATE',
        filters: expect.objectContaining({ search: 'walnut' })
      })
    )

    bcSpy.mockRestore()
    vi.useRealTimers()
  })
})

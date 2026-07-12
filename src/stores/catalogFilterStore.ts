import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Catalog Filter State
 * Manages search, category, price range, and stock status filters
 */
export interface CatalogFilters {
  search: string
  category: string[]
  priceRange: [number, number]
  stockStatus: 'all' | 'in-stock' | 'out-of-stock'
  viewMode?: 'grid' | 'list'
}

interface CatalogFilterStore {
  catalogFilters: CatalogFilters
  viewMode: 'grid' | 'list'
  saveTimeout: ReturnType<typeof setTimeout> | null
  setFilter: <K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K]
  ) => void
  setFilters: (filters: CatalogFilters) => void
  setViewMode: (mode: 'grid' | 'list') => void
  loadFilters: () => { filters: CatalogFilters; viewMode: 'grid' | 'list' } | null
  clearFilters: () => void
  resetFilters: () => void
}

/**
 * Initial/default filter state
 */
const initialFilters: CatalogFilters = {
  search: '',
  category: [],
  priceRange: [0, 100000],
  stockStatus: 'all',
}

const FILTER_VERSION = 2  // Increment on breaking change
const EXPIRY_TIME = 24 * 60 * 60 * 1000  // 24 hours
const STORAGE_KEY = `spaceos_catalog_v${FILTER_VERSION}`

// BroadcastChannel for multi-tab sync
const bc = typeof window !== 'undefined' ? new BroadcastChannel('spaceos_filters') : null

/**
 * Catalog Filter Store
 * - Persists filters to localStorage with sessionStorage fallback
 * - Multi-tab sync via BroadcastChannel
 * - 300ms debounce on save
 * - 24h expiry
 * - XSS protection: strips HTML tags from search input
 */
export const useCatalogFilterStore = create<CatalogFilterStore>()(
  persist(
    (set, get) => ({
      catalogFilters: initialFilters,
      viewMode: 'grid',
      saveTimeout: null,

      /**
       * Set a specific filter value
       * SECURITY: Strips HTML tags from search input (XSS protection)
       */
      setFilter: (key, value) => {
        set((state) => {
          let sanitizedValue = value

          // ✅ XSS Fix: Strip HTML tags from search input
          if (key === 'search' && typeof value === 'string') {
            sanitizedValue = value.replace(/<[^>]*>/g, '') as typeof value
          }

          const updatedFilters = {
            ...state.catalogFilters,
            [key]: sanitizedValue,
          }

          return { catalogFilters: updatedFilters }
        })

        // Trigger debounced save
        get().setFilters(get().catalogFilters)
      },

      /**
       * Set all filters at once (with debounced save)
       */
      setFilters: (filters) => {
        set({ catalogFilters: filters })

        // Clear previous timeout
        const { saveTimeout } = get()
        if (saveTimeout) clearTimeout(saveTimeout)

        // Debounce: save after 300ms
        const timeout = setTimeout(() => {
          try {
            const data = {
              filters,
              viewMode: get().viewMode,
              timestamp: Date.now(),
              version: FILTER_VERSION
            }
            const jsonStr = JSON.stringify(data)

            // Plan-B: Compression check
            if (jsonStr.length > 50000) {
              // Use sessionStorage if too large
              sessionStorage.setItem(STORAGE_KEY, jsonStr)
              console.warn('[CatalogStore] localStorage quota near limit, using sessionStorage')
            } else {
              localStorage.setItem(STORAGE_KEY, jsonStr)
            }

            // Multi-tab sync: notify other tabs
            if (bc) {
              bc.postMessage({
                type: 'FILTER_UPDATE',
                filters,
                viewMode: get().viewMode,
                timestamp: Date.now()
              })
            }
          } catch (e) {
            if (e instanceof Error && e.name === 'QuotaExceededError') {
              // Fallback to sessionStorage
              const data = { filters, viewMode: get().viewMode, timestamp: Date.now(), version: FILTER_VERSION }
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
              console.warn('[CatalogStore] localStorage quota exceeded, fallback to sessionStorage')
            }
          }
        }, 300)

        set({ saveTimeout: timeout })
      },

      /**
       * Set view mode (grid/list) and save immediately
       */
      setViewMode: (viewMode) => {
        set({ viewMode })
        // Trigger immediate save
        get().setFilters(get().catalogFilters)
      },

      /**
       * Load filters from storage (with expiry check)
       */
      loadFilters: () => {
        // Try localStorage first
        let stored = localStorage.getItem(STORAGE_KEY)

        // Fallback to sessionStorage
        if (!stored) {
          stored = sessionStorage.getItem(STORAGE_KEY)
        }

        if (!stored) return null

        try {
          const { filters, viewMode, timestamp } = JSON.parse(stored)

          // Expiry check: 24 hours
          if (Date.now() - timestamp > EXPIRY_TIME) {
            localStorage.removeItem(STORAGE_KEY)
            sessionStorage.removeItem(STORAGE_KEY)
            return null
          }

          return { filters, viewMode: viewMode || 'grid' }
        } catch (e) {
          console.error('[CatalogStore] Failed to load filters:', e)
          return null
        }
      },

      /**
       * Clear all filters and storage
       */
      clearFilters: () => {
        set({ catalogFilters: initialFilters, viewMode: 'grid' })
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
      },

      /**
       * Reset all filters to initial state
       */
      resetFilters: () => {
        set({ catalogFilters: initialFilters })

        // Clear URL params
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', window.location.pathname)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: FILTER_VERSION,
      partialize: (state) => ({
        catalogFilters: state.catalogFilters,
        viewMode: state.viewMode
      })
    }
  )
)

// Listen to BroadcastChannel from other tabs
if (bc) {
  bc.onmessage = (event) => {
    if (event.data.type === 'FILTER_UPDATE') {
      useCatalogFilterStore.setState({
        catalogFilters: event.data.filters,
        viewMode: event.data.viewMode
      })
    }
  }
}

/**
 * Initialize filters from URL on page load
 * Call this in the catalog page component's useEffect
 */
export function initFiltersFromURL(): Partial<CatalogFilters> {
  if (typeof window === 'undefined') return {}

  const searchParams = new URLSearchParams(window.location.search)
  const filters: Partial<CatalogFilters> = {}

  const query = searchParams.get('q')
  if (query) {
    filters.search = query.replace(/<[^>]*>/g, '') // ✅ XSS protection
  }

  const categories = searchParams.get('cat')
  if (categories) {
    filters.category = categories.split(',')
  }

  const priceMin = searchParams.get('price_min')
  const priceMax = searchParams.get('price_max')
  if (priceMin && priceMax) {
    filters.priceRange = [parseInt(priceMin), parseInt(priceMax)]
  }

  const stock = searchParams.get('stock')
  if (stock === 'in-stock' || stock === 'out-of-stock') {
    filters.stockStatus = stock
  }

  return filters
}

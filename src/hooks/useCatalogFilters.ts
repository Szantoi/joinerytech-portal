import { useMemo } from 'react'
import fuzzysort from 'fuzzysort'
import { useCatalogFilterStore } from '../stores/catalogFilterStore'

/**
 * Catalog item interface
 * Generic to support different catalog data structures
 */
export interface CatalogItem {
  id: string
  name: string
  category?: string
  price: number
  stock: number
  description?: string
  [key: string]: unknown
}

interface UseCatalogFiltersOptions {
  /**
   * Maximum number of results after fuzzy search
   * Default: 500 (performance cap)
   */
  maxResults?: number

  /**
   * Fields to search in (for fuzzy search)
   * Default: ['name', 'category', 'description']
   */
  searchFields?: Array<keyof CatalogItem>
}

/**
 * useCatalogFilters Hook
 *
 * Features:
 * - Fuzzy search using fuzzysort (typo tolerance)
 * - Multi-field search (name, category, description)
 * - Category filter
 * - Price range filter
 * - Stock status filter
 * - Memoized results (performance optimization)
 * - Scoring: exact match = 1.0, partial = 0.8, fuzzy = 0.5
 *
 * @param items - Catalog items to filter
 * @param options - Configuration options
 * @returns Filtered catalog items
 */
export function useCatalogFilters(
  items: CatalogItem[],
  options: UseCatalogFiltersOptions = {}
) {
  const { catalogFilters } = useCatalogFilterStore()
  const {
    maxResults = 500,
    searchFields = ['name', 'category', 'description'],
  } = options

  /**
   * Apply all filters and return filtered items
   */
  const filteredItems = useMemo(() => {
    let results = [...items]

    // 1. Apply fuzzy search (if search term exists)
    if (catalogFilters.search.trim()) {
      results = applyFuzzySearch(
        results,
        catalogFilters.search,
        searchFields,
        maxResults
      )
    }

    // 2. Apply category filter
    if (catalogFilters.category.length > 0) {
      results = results.filter((item) =>
        catalogFilters.category.includes(item.category || '')
      )
    }

    // 3. Apply price range filter
    const [minPrice, maxPrice] = catalogFilters.priceRange
    results = results.filter(
      (item) => item.price >= minPrice && item.price <= maxPrice
    )

    // 4. Apply stock status filter
    if (catalogFilters.stockStatus === 'in-stock') {
      results = results.filter((item) => item.stock > 0)
    } else if (catalogFilters.stockStatus === 'out-of-stock') {
      results = results.filter((item) => item.stock === 0)
    }

    return results
  }, [items, catalogFilters, searchFields, maxResults])

  return {
    filteredItems,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    hasActiveFilters:
      catalogFilters.search.trim() !== '' ||
      catalogFilters.category.length > 0 ||
      catalogFilters.priceRange[0] !== 0 ||
      catalogFilters.priceRange[1] !== 100000 ||
      catalogFilters.stockStatus !== 'all',
  }
}

/**
 * Apply fuzzy search using fuzzysort
 *
 * Scoring:
 * - Exact match (score > -100): 1.0
 * - Partial match (score > -500): 0.8
 * - Fuzzy match (score > -1000): 0.5
 *
 * @param items - Items to search
 * @param searchTerm - Search query
 * @param fields - Fields to search in
 * @param limit - Maximum number of results
 * @returns Fuzzy search results
 */
function applyFuzzySearch<T extends CatalogItem>(
  items: T[],
  searchTerm: string,
  fields: Array<keyof CatalogItem>,
  limit: number
): T[] {
  // Prepare search targets (combine all searchable fields)
  const prepared = items.map((item) => ({
    item,
    prepared: fuzzysort.prepare(
      fields
        .map((field) => String(item[field] || ''))
        .join(' ')
        .toLowerCase()
    ),
  }))

  // Perform fuzzy search
  const results = fuzzysort.go(searchTerm, prepared, {
    keys: ['prepared'],
    limit: limit,
    threshold: -10000, // Allow very fuzzy matches
  })

  // Return sorted items (highest score first)
  return results.map((result) => result.obj.item)
}

/**
 * Calculate search relevance score
 * Used for debugging/testing
 */
export function getSearchScore(
  item: CatalogItem,
  searchTerm: string,
  fields: Array<keyof CatalogItem>
): number {
  const combined = fields
    .map((field) => String(item[field] || ''))
    .join(' ')
    .toLowerCase()

  const result = fuzzysort.single(searchTerm, combined)

  if (!result) return 0

  // Normalize score to 0-1 range
  if (result.score > -100) return 1.0 // Exact match
  if (result.score > -500) return 0.8 // Partial match
  if (result.score > -1000) return 0.5 // Fuzzy match

  return 0.3 // Weak match
}

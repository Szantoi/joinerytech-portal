import { SmartSearchBar } from './SmartSearchBar'
import { CategoryChips } from './CategoryChips'
import { PriceRangeSlider } from './PriceRangeSlider'
import { StockStatusToggle } from './StockStatusToggle'
import { VoiceSearchButton } from './VoiceSearchButton'
import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface CatalogFilterBarProps {
  /**
   * Available categories for filtering
   */
  categories: string[]

  /**
   * Price range bounds
   */
  minPrice?: number
  maxPrice?: number

  /**
   * Show voice search button
   */
  enableVoiceSearch?: boolean

  className?: string
}

/**
 * CatalogFilterBar Component
 *
 * Complete filter bar with:
 * - Smart search (fuzzy, debounced, XSS protected)
 * - Category chips (multi-select)
 * - Price range slider
 * - Stock status toggle
 * - Voice search (optional, progressive enhancement)
 *
 * All filters are synced to:
 * - Zustand store (catalogFilterStore)
 * - localStorage (persistence)
 * - URL query params (shareable links)
 */
export function CatalogFilterBar({
  categories,
  minPrice = 0,
  maxPrice = 100000,
  enableVoiceSearch = true,
  className = '',
}: CatalogFilterBarProps) {
  const { resetFilters, catalogFilters } = useCatalogFilterStore()

  const hasActiveFilters =
    catalogFilters.search.trim() !== '' ||
    catalogFilters.category.length > 0 ||
    catalogFilters.priceRange[0] !== minPrice ||
    catalogFilters.priceRange[1] !== maxPrice ||
    catalogFilters.stockStatus !== 'all'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar + Voice Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SmartSearchBar />
        </div>
        {enableVoiceSearch && <VoiceSearchButton />}
      </div>

      {/* Category Chips */}
      {categories.length > 0 && <CategoryChips categories={categories} />}

      {/* Price Range Slider */}
      <PriceRangeSlider min={minPrice} max={maxPrice} />

      {/* Stock Status Toggle */}
      <StockStatusToggle />

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={resetFilters}
            className="
              w-full
              px-4
              py-2
              text-sm
              font-medium
              text-gray-700
              bg-white
              border
              border-gray-300
              rounded-lg
              hover:bg-gray-50
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
              transition-colors
            "
          >
            🔄 Összes szűrő törlése
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Export individual components for flexibility
 */
export { SmartSearchBar } from './SmartSearchBar'
export { CategoryChips, extractCategories } from './CategoryChips'
export { PriceRangeSlider } from './PriceRangeSlider'
export { StockStatusToggle } from './StockStatusToggle'
export { VoiceSearchButton } from './VoiceSearchButton'

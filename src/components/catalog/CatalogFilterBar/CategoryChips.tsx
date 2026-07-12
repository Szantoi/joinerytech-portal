import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface CategoryChipsProps {
  /**
   * Available categories (distinct values from catalog data)
   * In a real app, this would come from the catalog API or data
   */
  categories: string[]
  className?: string
}

/**
 * CategoryChips Component
 *
 * Features:
 * - Multi-select category filter chips
 * - Active state styling (blue background for selected)
 * - Click to toggle on/off
 * - Accessible (keyboard navigation, ARIA labels)
 */
export function CategoryChips({
  categories,
  className = '',
}: CategoryChipsProps) {
  const { catalogFilters, setFilter } = useCatalogFilterStore()
  const selectedCategories = catalogFilters.category

  /**
   * Toggle category selection
   */
  const handleToggleCategory = (category: string) => {
    const isSelected = selectedCategories.includes(category)

    const updatedCategories = isSelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]

    setFilter('category', updatedCategories)
  }

  /**
   * Clear all category selections
   */
  const handleClearAll = () => {
    setFilter('category', [])
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Kategóriák:</span>

        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="
              text-xs
              text-blue-600
              hover:text-blue-800
              underline
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              rounded
            "
            aria-label="Minden kategória szűrő törlése"
          >
            Összes törlése
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category)

          return (
            <button
              key={category}
              type="button"
              onClick={() => handleToggleCategory(category)}
              className={`
                px-3
                py-1.5
                text-sm
                font-medium
                rounded-full
                border
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-offset-1
                ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                }
              `}
              aria-label={`${category} kategória${
                isSelected ? ' (kiválasztva, kattintással eltávolítható)' : ''
              }`}
              aria-pressed={isSelected}
            >
              {category}
              {isSelected && (
                <span className="ml-1.5" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected count indicator */}
      {selectedCategories.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {selectedCategories.length} kategória kiválasztva
        </div>
      )}
    </div>
  )
}

/**
 * Extract unique categories from catalog data
 * Helper function to get distinct category values
 */
export function extractCategories<T extends { category?: string }>(
  items: T[]
): string[] {
  const categories = new Set<string>()

  items.forEach((item) => {
    if (item.category) {
      categories.add(item.category)
    }
  })

  return Array.from(categories).sort()
}

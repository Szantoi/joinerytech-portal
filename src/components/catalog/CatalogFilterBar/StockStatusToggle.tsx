import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface StockStatusToggleProps {
  className?: string
}

type StockStatus = 'all' | 'in-stock' | 'out-of-stock'

/**
 * StockStatusToggle Component
 *
 * Features:
 * - 3-state toggle: All / In Stock / Out of Stock
 * - Radio button group semantics
 * - Visual active state
 * - Accessible (keyboard navigation, ARIA labels)
 */
export function StockStatusToggle({ className = '' }: StockStatusToggleProps) {
  const { catalogFilters, setFilter } = useCatalogFilterStore()
  const currentStatus = catalogFilters.stockStatus

  /**
   * Handle status change
   */
  const handleStatusChange = (status: StockStatus) => {
    setFilter('stockStatus', status)
  }

  const options: { value: StockStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'Összes termék', icon: '📦' },
    { value: 'in-stock', label: 'Raktáron', icon: '✅' },
    { value: 'out-of-stock', label: 'Nincs készleten', icon: '❌' },
  ]

  return (
    <div className={`${className}`}>
      <span className="text-sm font-medium text-gray-700 block mb-2">
        Készlet állapot:
      </span>

      <div
        className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
        role="radiogroup"
        aria-label="Készlet állapot szűrő"
      >
        {options.map((option, index) => {
          const isActive = currentStatus === option.value
          const isFirst = index === 0
          const isLast = index === options.length - 1

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`
                px-4
                py-2
                text-sm
                font-medium
                transition-all
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-inset
                focus:ring-blue-500
                ${!isFirst ? 'border-l border-gray-300' : ''}
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
              role="radio"
              aria-checked={isActive}
              aria-label={option.label}
            >
              <span aria-hidden="true" className="mr-2">
                {option.icon}
              </span>
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">
                {option.value === 'all'
                  ? 'Mind'
                  : option.value === 'in-stock'
                  ? 'Készlet'
                  : 'Nincs'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

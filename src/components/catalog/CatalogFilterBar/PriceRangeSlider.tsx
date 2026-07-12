import { useState, useEffect } from 'react'
import ReactSlider from 'react-slider'
import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface PriceRangeSliderProps {
  min?: number
  max?: number
  step?: number
  className?: string
}

/**
 * PriceRangeSlider Component
 *
 * Features:
 * - Dual-thumb range slider using react-slider
 * - Real-time price display (formatted as HUF)
 * - Debounced filter update (for performance)
 * - Accessible (keyboard navigation, ARIA labels)
 */
export function PriceRangeSlider({
  min = 0,
  max = 100000,
  step = 500,
  className = '',
}: PriceRangeSliderProps) {
  const { catalogFilters, setFilter } = useCatalogFilterStore()
  const [localRange, setLocalRange] = useState<[number, number]>(
    catalogFilters.priceRange
  )

  /**
   * Sync local range with store when external changes occur
   */
  useEffect(() => {
    setLocalRange(catalogFilters.priceRange)
  }, [catalogFilters.priceRange])

  /**
   * Handle slider change
   */
  const handleSliderChange = (value: number | readonly number[]) => {
    const range = value as [number, number]
    setLocalRange(range)
  }

  /**
   * Handle slider after change (commit to store)
   */
  const handleAfterChange = (value: number | readonly number[]) => {
    const range = value as [number, number]
    setFilter('priceRange', range)
  }

  /**
   * Format price as HUF
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700">Ár tartomány:</span>
        <div className="text-xs text-gray-500 mt-1">
          {formatPrice(localRange[0])} - {formatPrice(localRange[1])}
        </div>
      </div>

      <div className="px-2">
        <ReactSlider
          value={localRange}
          onChange={handleSliderChange}
          onAfterChange={handleAfterChange}
          min={min}
          max={max}
          step={step}
          minDistance={step}
          className="h-2 w-full"
          thumbClassName="
            w-5
            h-5
            bg-blue-600
            rounded-full
            cursor-grab
            active:cursor-grabbing
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-2
            -top-1.5
          "
          trackClassName="bg-gray-200 h-2 rounded-full"
          renderThumb={(props, state) => {
            const value = Array.isArray(state.value) ? state.value[0] : state.value
            return (
              <div
                {...props}
                aria-label={`Ár ${state.index === 0 ? 'minimum' : 'maximum'}`}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={formatPrice(value)}
              />
            )
          }}
          renderTrack={(props, state) => {
            const isMiddle = state.index === 1
            return (
              <div
                {...props}
                className={`
                  h-2
                  rounded-full
                  ${isMiddle ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              />
            )
          }}
          pearling
          ariaLabel={['Minimum ár', 'Maximum ár']}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  )
}

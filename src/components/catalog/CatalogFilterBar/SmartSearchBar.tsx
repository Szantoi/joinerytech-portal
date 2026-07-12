import { useState, useEffect, useRef } from 'react'
import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface SmartSearchBarProps {
  placeholder?: string
  debounceMs?: number
  className?: string
}

/**
 * SmartSearchBar Component
 *
 * Features:
 * - Debounced search (default 300ms)
 * - XSS protection (strips HTML tags)
 * - Clear button
 * - Loading indicator during debounce
 *
 * SECURITY: All input is sanitized before updating the store
 */
export function SmartSearchBar({
  placeholder = 'Keresés a katalógusban...',
  debounceMs = 300,
  className = '',
}: SmartSearchBarProps) {
  const { catalogFilters, setFilter } = useCatalogFilterStore()
  const [localValue, setLocalValue] = useState(catalogFilters.search)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Sync local value with store when external changes occur
   */
  useEffect(() => {
    setLocalValue(catalogFilters.search)
  }, [catalogFilters.search])

  /**
   * Handle input change with debounce
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value

    // ✅ CRITICAL FIX (v3-H1): Strip HTML tags (XSS protection)
    value = value.replace(/<[^>]*>/g, '')

    // Update local state immediately (for responsive UI)
    setLocalValue(value)
    setIsDebouncing(true)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new debounced timer
    debounceTimer.current = setTimeout(() => {
      setFilter('search', value)
      setIsDebouncing(false)
    }, debounceMs)
  }

  /**
   * Clear search
   */
  const handleClear = () => {
    setLocalValue('')
    setFilter('search', '')
    setIsDebouncing(false)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
  }

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="
            w-full
            pl-10
            pr-20
            py-2.5
            text-sm
            border
            border-gray-300
            rounded-lg
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
            transition-colors
          "
          aria-label="Katalógus keresés"
        />

        {/* Loading Indicator + Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {isDebouncing && (
            <div
              className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"
              role="status"
              aria-label="Keresés folyamatban"
            />
          )}

          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="
                text-gray-400
                hover:text-gray-600
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                rounded
              "
              aria-label="Keresés törlése"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search suggestions/results count (optional) */}
      {catalogFilters.search && (
        <div className="mt-1 text-xs text-gray-500">
          Keresés: "{catalogFilters.search}"
        </div>
      )}
    </div>
  )
}

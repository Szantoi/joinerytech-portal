import { useState, useEffect } from 'react'
import type { RfqFilterCounts } from '../../hooks/useRfqFilters'

interface StatusTab {
  key: string
  label: string
  count: number
}

export interface RfqFilterBarProps {
  status: string
  query: string
  searchScope: 'rfq' | 'products' | 'both'
  counts: RfqFilterCounts
  onStatusChange: (status: string) => void
  onQueryChange: (query: string) => void
  onSearchScopeChange: (scope: 'rfq' | 'products' | 'both') => void
}

/**
 * RfqFilterBar
 *
 * Sticky filter bar with status tabs, search input, and scope toggle.
 *
 * Features:
 * - Status tabs with badge counts
 * - Debounced search input (300ms)
 * - Search scope toggle (RFQ / Products / Both)
 * - Responsive design
 */
export function RfqFilterBar({
  status,
  query,
  searchScope,
  counts,
  onStatusChange,
  onQueryChange,
  onSearchScopeChange,
}: RfqFilterBarProps) {
  const [searchValue, setSearchValue] = useState(query)

  // Debounce search input (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      onQueryChange(searchValue)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchValue, onQueryChange])

  // Sync external query changes
  useEffect(() => {
    setSearchValue(query)
  }, [query])

  const tabs: StatusTab[] = [
    { key: 'open', label: 'Nyitott', count: counts.open },
    { key: 'quoted', label: 'Árajánlat', count: counts.quoted },
    { key: 'closed', label: 'Lezárt', count: counts.closed },
    { key: 'all', label: 'Összes', count: counts.all },
  ]

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-stone-200/80 shadow-sm">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 px-5 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={`
              px-3 py-2 text-[12px] font-medium rounded-t-md transition
              ${
                status === tab.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }
            `}
          >
            {tab.label}
            <span
              className={`
                ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums
                ${
                  status === tab.key
                    ? 'bg-teal-700 text-teal-50'
                    : 'bg-stone-200 text-stone-500'
                }
              `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Scope */}
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Keresés RFQ számban vagy termékekben..."
            className="
              w-full px-3 py-2 pr-10 text-[12px] border border-stone-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
              placeholder:text-stone-400
            "
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Scope Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-md border border-stone-200">
          <span className="text-[10px] text-stone-500 uppercase tracking-wide">Keresés:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onSearchScopeChange('rfq')}
              className={`
                px-2 py-1 text-[11px] font-medium rounded transition
                ${
                  searchScope === 'rfq'
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              RFQ
            </button>
            <button
              onClick={() => onSearchScopeChange('products')}
              className={`
                px-2 py-1 text-[11px] font-medium rounded transition
                ${
                  searchScope === 'products'
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              Termék
            </button>
            <button
              onClick={() => onSearchScopeChange('both')}
              className={`
                px-2 py-1 text-[11px] font-medium rounded transition
                ${
                  searchScope === 'both'
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              Mind
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

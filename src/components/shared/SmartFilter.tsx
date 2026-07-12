import { useState } from 'react'
import { FilterRow } from './FilterRow'
import { FilterPresets } from './FilterPresets'
import { useFilterState, type FilterConfig } from '../../hooks/useFilterState'
import { Icon } from '../ui'

export interface SmartFilterProps<T = any> {
  config: FilterConfig
  data: T[]
  onFilter: (filteredData: T[]) => void
  presetKey: string
  showPresets?: boolean
  collapsed?: boolean
}

/**
 * SmartFilter
 *
 * Generic, config-driven filter container.
 *
 * Features:
 * - Dynamic filter rows (add/remove)
 * - Config-driven field options
 * - URL sync (bookmarkable filters)
 * - FilterPresets (saved queries)
 * - Memoized filter logic
 *
 * Usage:
 * ```tsx
 * <SmartFilter
 *   config={RFQ_FILTER_CONFIG}
 *   data={rfqs}
 *   onFilter={setFilteredRfqs}
 *   presetKey="rfq"
 * />
 * ```
 */
export function SmartFilter<T = any>({
  config,
  data,
  onFilter,
  presetKey,
  showPresets = true,
  collapsed: initialCollapsed = false,
}: SmartFilterProps<T>) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const {
    activeFilters,
    filteredData,
    presets,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    savePreset,
    loadPreset,
    deletePreset,
  } = useFilterState<T>(config, data, presetKey)

  /**
   * Emit filtered data to parent
   */
  React.useEffect(() => {
    onFilter(filteredData)
  }, [filteredData, onFilter])

  /**
   * Add a new empty filter row
   */
  const handleAddFilter = () => {
    // Add a placeholder filter (will be completed by FilterRow)
    const firstField = config.fields[0]
    const firstOperator = config.operators[firstField.type]?.[0] || '='
    addFilter(firstField.id, firstOperator, '')
  }

  /**
   * Update filter when FilterRow changes
   */
  const handleFilterRowChange = (
    filterId: string,
    field: string,
    operator: string,
    value: any
  ) => {
    updateFilter(filterId, { field, operator, value })
  }

  if (collapsed) {
    return (
      <div className="p-3 bg-white border border-stone-200 rounded-lg">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 text-[12px] text-stone-600 hover:text-stone-900"
        >
          <Icon name="filter" size={14} />
          <span>Show filters</span>
          {activeFilters.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded bg-teal-100 text-teal-700 font-semibold">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border border-stone-200 rounded-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="filter" size={14} className="text-stone-500" />
          <h3 className="text-[13px] font-semibold text-stone-900">Smart Filter</h3>
          {activeFilters.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-[10.5px] font-semibold">
              {activeFilters.length} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-stone-500 hover:text-stone-700 font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            className="text-stone-400 hover:text-stone-600"
            title="Collapse filters"
          >
            <Icon name="chevron-up" size={14} />
          </button>
        </div>
      </div>

      {/* Filter Presets */}
      {showPresets && (
        <FilterPresets
          presets={presets}
          activeFilters={activeFilters}
          onLoadPreset={loadPreset}
          onSavePreset={savePreset}
          onDeletePreset={deletePreset}
        />
      )}

      {/* Active Filter Rows */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          {activeFilters.map((filter) => (
            <FilterRow
              key={filter.id}
              filterId={filter.id}
              config={config}
              field={filter.field}
              operator={filter.operator}
              value={filter.value}
              onChange={(field, operator, value) =>
                handleFilterRowChange(filter.id, field, operator, value)
              }
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
        </div>
      )}

      {/* Add Filter Button */}
      <button
        onClick={handleAddFilter}
        className="flex items-center gap-2 px-3 py-2 text-[12px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition font-medium"
      >
        <Icon name="plus" size={14} />
        <span>Add filter</span>
      </button>

      {/* Results Summary */}
      <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
        Showing <strong className="text-stone-900">{filteredData.length}</strong> of{' '}
        <strong className="text-stone-900">{data.length}</strong> results
      </div>
    </div>
  )
}

// Fix missing React import for useEffect
import React from 'react'

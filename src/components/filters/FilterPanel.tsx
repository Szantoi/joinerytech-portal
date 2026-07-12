import { useState } from 'react'
import { Icon } from '../ui'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterCategory {
  key: string
  label: string
  options: FilterOption[]
}

export interface FilterPanelProps {
  categories: FilterCategory[]
  selected: Record<string, string[]>
  onChange: (categoryKey: string, values: string[]) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function FilterPanel({
  categories,
  selected,
  onChange,
  collapsed = false,
  onCollapsedChange,
}: FilterPanelProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }))
  }

  const handleCheckboxChange = (categoryKey: string, value: string, checked: boolean) => {
    const currentValues = selected[categoryKey] || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value)
    onChange(categoryKey, newValues)
  }

  const handleSelectAll = (categoryKey: string) => {
    const category = categories.find((c) => c.key === categoryKey)
    if (!category) return
    const allValues = category.options.map((opt) => opt.value)
    onChange(categoryKey, allValues)
  }

  const handleClearAll = (categoryKey: string) => {
    onChange(categoryKey, [])
  }

  const totalSelectedCount = Object.values(selected).reduce(
    (sum, arr) => sum + arr.length,
    0
  )

  if (collapsed) {
    return (
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 p-3">
        <button
          onClick={() => onCollapsedChange?.(false)}
          className="flex items-center gap-2 text-[12px] text-stone-600 hover:text-stone-900"
        >
          <Icon name="filter" size={14} />
          <span>Szűrők megjelenítése</span>
          {totalSelectedCount > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded bg-teal-100 text-teal-700 font-semibold">
              {totalSelectedCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-stone-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="filter" size={14} className="text-stone-500" />
            <h3 className="text-[13px] font-semibold text-stone-900">Szűrők</h3>
            {totalSelectedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-[10.5px] font-semibold">
                {totalSelectedCount}
              </span>
            )}
          </div>
          <button
            onClick={() => onCollapsedChange?.(true)}
            className="text-stone-400 hover:text-stone-600"
            title="Szűrők elrejtése"
          >
            <Icon name="chevron-up" size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((category) => {
            const isCategoryCollapsed = collapsedCategories[category.key] || false
            const selectedCount = selected[category.key]?.length || 0

            return (
              <div
                key={category.key}
                className="border border-stone-200 rounded-lg overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.key)}
                  className="w-full flex items-center justify-between p-2 bg-stone-50 hover:bg-stone-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={isCategoryCollapsed ? 'chevron-right' : 'chevron-down'}
                      size={12}
                      className="text-stone-500"
                    />
                    <span className="text-[12px] font-medium text-stone-700">
                      {category.label}
                    </span>
                    {selectedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-semibold">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                </button>

                {/* Category Options */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isCategoryCollapsed ? 'max-h-0' : 'max-h-96'
                  }`}
                >
                  <div className="p-2 space-y-0.5">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-stone-200">
                      <button
                        onClick={() => handleSelectAll(category.key)}
                        className="text-[10.5px] text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Összes
                      </button>
                      <span className="text-stone-300">•</span>
                      <button
                        onClick={() => handleClearAll(category.key)}
                        className="text-[10.5px] text-stone-500 hover:text-stone-700 font-medium"
                      >
                        Egyik sem
                      </button>
                    </div>

                    {/* Checkboxes */}
                    {category.options.map((option) => {
                      const isChecked = selected[category.key]?.includes(option.value) || false

                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-stone-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleCheckboxChange(category.key, option.value, e.target.checked)
                            }
                            className="w-4 h-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-[12px] text-stone-700">{option.label}</span>
                          {option.count !== undefined && (
                            <span className="ml-auto text-[10.5px] text-stone-400 tabular-nums">
                              {option.count}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

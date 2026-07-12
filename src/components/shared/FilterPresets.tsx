import { useState } from 'react'
import type { FilterPreset, FilterRow } from '../../hooks/useFilterState'
import { Icon } from '../ui'

export interface FilterPresetsProps {
  presets: FilterPreset[]
  activeFilters: FilterRow[]
  onLoadPreset: (presetId: string) => void
  onSavePreset: (name: string) => void
  onDeletePreset: (presetId: string) => void
}

/**
 * FilterPresets
 *
 * UI for managing saved filter queries:
 * - Quick preset buttons ("Last 30 days", etc.)
 * - Dropdown to load saved presets
 * - Save current filter as new preset
 * - Delete preset action
 */
export function FilterPresets({
  presets,
  activeFilters,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
}: FilterPresetsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')

  /**
   * Handle save preset
   */
  const handleSave = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim())
      setPresetName('')
      setShowSaveDialog(false)
    }
  }

  /**
   * Quick preset buttons (hardcoded common filters)
   */
  const quickPresets = [
    {
      id: 'last-30d',
      label: 'Last 30 days',
      onClick: () => {
        // TODO: Implement quick preset logic
        // For now, just a placeholder
        console.log('Quick preset: Last 30 days')
      },
    },
    {
      id: 'high-value',
      label: 'High-value',
      onClick: () => {
        // TODO: Implement quick preset logic
        console.log('Quick preset: High-value')
      },
    },
  ]

  return (
    <div className="space-y-2">
      {/* Quick Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-stone-500 font-medium">Quick filters:</span>
        {quickPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={preset.onClick}
            className="px-2.5 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Saved Presets Dropdown + Actions */}
      <div className="flex items-center gap-2">
        {/* Load preset dropdown */}
        {presets.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLoadPreset(e.target.value)
              }
            }}
            className="flex-1 px-3 py-1.5 text-[11px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            defaultValue=""
          >
            <option value="">Load saved filter...</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.filters.length} filters)
              </option>
            ))}
          </select>
        )}

        {/* Save current filter button */}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition font-medium"
          >
            <Icon name="bookmark" size={12} />
            <span>Save filter</span>
          </button>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Enter preset name..."
              className="flex-1 px-3 py-2 text-[12px] border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false)
                setPresetName('')
              }}
              className="px-3 py-2 text-[11px] text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preset List (with delete option) */}
      {presets.length > 0 && (
        <div className="pt-2 border-t border-stone-200">
          <div className="text-[10.5px] text-stone-500 font-medium mb-1.5">
            Saved presets ({presets.length}/10)
          </div>
          <div className="space-y-1">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 bg-stone-50 rounded-md hover:bg-stone-100 transition group"
              >
                <button
                  onClick={() => onLoadPreset(preset.id)}
                  className="flex-1 text-left text-[11px] text-stone-700 hover:text-stone-900"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-stone-500 ml-2">
                    ({preset.filters.length} filters)
                  </span>
                </button>
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className="p-1 text-stone-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                  title="Delete preset"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

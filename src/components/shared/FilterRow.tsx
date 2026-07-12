import { useState, useEffect } from 'react'
import type { FilterField, FilterConfig } from '../../hooks/useFilterState'
import { Icon } from '../ui'

export interface FilterRowProps {
  filterId: string
  config: FilterConfig
  field?: string
  operator?: string
  value?: any
  onChange: (field: string, operator: string, value: any) => void
  onRemove: () => void
}

/**
 * FilterRow
 *
 * A single filter row with:
 * - Field selector dropdown
 * - Operator dropdown (based on field type)
 * - Value input (text/multiselect/daterange)
 * - Remove button
 */
export function FilterRow({
  filterId,
  config,
  field: initialField,
  operator: initialOperator,
  value: initialValue,
  onChange,
  onRemove,
}: FilterRowProps) {
  const [selectedField, setSelectedField] = useState<string>(initialField || '')
  const [selectedOperator, setSelectedOperator] = useState<string>(initialOperator || '')
  const [inputValue, setInputValue] = useState<any>(initialValue || '')

  // Get current field config
  const fieldConfig = config.fields.find((f) => f.id === selectedField)
  const fieldType = fieldConfig?.type || 'text'

  // Get available operators for current field type
  const availableOperators = config.operators[fieldType] || []

  /**
   * Auto-select first operator when field changes
   */
  useEffect(() => {
    if (selectedField && !selectedOperator && availableOperators.length > 0) {
      setSelectedOperator(availableOperators[0])
    }
  }, [selectedField, selectedOperator, availableOperators])

  /**
   * Emit onChange when all values are set
   */
  useEffect(() => {
    if (selectedField && selectedOperator && inputValue !== '') {
      onChange(selectedField, selectedOperator, inputValue)
    }
  }, [selectedField, selectedOperator, inputValue, onChange])

  /**
   * Handle field selection
   */
  const handleFieldChange = (newField: string) => {
    setSelectedField(newField)
    setSelectedOperator('')
    setInputValue('')
  }

  /**
   * Handle operator selection
   */
  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator)
  }

  /**
   * Handle value input change
   */
  const handleValueChange = (newValue: any) => {
    setInputValue(newValue)
  }

  /**
   * Render value input based on field type
   */
  const renderValueInput = () => {
    if (!fieldConfig) {
      return null
    }

    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value..."
            className="flex-1 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={inputValue}
            onChange={(e) => handleValueChange(parseFloat(e.target.value))}
            placeholder="Enter number..."
            className="flex-1 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        )

      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(inputValue) ? inputValue : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value)
              handleValueChange(selected)
            }}
            className="flex-1 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[80px]"
          >
            {fieldConfig.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'daterange':
        return (
          <div className="flex-1 flex gap-2">
            <input
              type="date"
              value={inputValue?.start || ''}
              onChange={(e) =>
                handleValueChange({ ...inputValue, start: e.target.value })
              }
              className="flex-1 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <span className="text-[12px] text-stone-500 self-center">to</span>
            <input
              type="date"
              value={inputValue?.end || ''}
              onChange={(e) =>
                handleValueChange({ ...inputValue, end: e.target.value })
              }
              className="flex-1 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex items-start gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
      {/* Field selector */}
      <select
        value={selectedField}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="w-40 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      >
        <option value="">Select field...</option>
        {config.fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      {selectedField && (
        <select
          value={selectedOperator}
          onChange={(e) => handleOperatorChange(e.target.value)}
          className="w-32 px-3 py-2 text-[12px] border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Operator...</option>
          {availableOperators.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      )}

      {/* Value input */}
      {selectedField && selectedOperator && renderValueInput()}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        title="Remove filter"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}

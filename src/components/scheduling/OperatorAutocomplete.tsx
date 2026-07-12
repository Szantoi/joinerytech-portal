import { useState, useEffect } from 'react'
import { useApi, API_BASE } from '../../hooks/useApi'
import { Icon } from '../ui'
import type { Operator } from '../../types/scheduling.types'

interface OperatorAutocompleteProps {
  selectedOperator: Operator | null
  onOperatorChange: (operator: Operator | null) => void
  disabled?: boolean
}

export function OperatorAutocomplete({
  selectedOperator,
  onOperatorChange,
  disabled = false,
}: OperatorAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch all operators (no pagination needed for MVP - machine_operator role is limited)
  const { data: allOperators } = useApi<Operator[]>(
    `${API_BASE.identity}/users?role=machine_operator`
  )

  const filteredOperators = (allOperators ?? []).filter(op =>
    op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleSelect(operator: Operator) {
    onOperatorChange(operator)
    setSearchQuery(operator.name)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Icon
          name="user"
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          placeholder="Select operator..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            onOperatorChange(null)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          disabled={disabled}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-stone-200 text-sm bg-white outline-none focus:border-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {showDropdown && !disabled && filteredOperators.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredOperators.map((operator) => (
            <button
              key={operator.id}
              type="button"
              onMouseDown={() => handleSelect(operator)}
              className="w-full text-left px-3 py-2 hover:bg-stone-50 border-b border-stone-100 last:border-b-0 text-sm"
            >
              <div className="font-medium text-stone-900">{operator.name}</div>
              <div className="text-xs text-stone-500">{operator.email}</div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !disabled && filteredOperators.length === 0 && searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 p-3 text-sm text-stone-500">
          No operators found
        </div>
      )}

      {selectedOperator && (
        <div className="mt-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
          <div className="text-sm font-medium text-stone-900">{selectedOperator.name}</div>
          <div className="text-xs text-stone-500">{selectedOperator.email}</div>
        </div>
      )}
    </div>
  )
}

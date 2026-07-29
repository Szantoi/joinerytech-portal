import { useState, useEffect } from 'react'
import { useApi, API_BASE } from '../../hooks/useApi'
import { Icon } from '@spaceos/portal-ui'
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

  // Operátor-lista (nincs lapozás: a gépkezelő-kör kicsi).
  const { data: allOperators, refetch: refetchOperators } = useApi<Operator[]>(
    `${API_BASE.identity}/users?role=machine_operator`
  )

  // A `useApi` LUSTA: a fetch csak innen indul. Ez a hívás eddig hiányzott —
  // az `useEffect` importálva volt, de sosem használva (a lint ezt jelezte is,
  // csak kozmetikai adósságnak látszott). Következmény: a lista sosem töltődött
  // be, tehát operátort NEM lehetett választani, tehát köteget sem kiosztani.
  useEffect(() => {
    refetchOperators()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          placeholder="Operátor keresése…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            onOperatorChange(null)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          disabled={disabled}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-line text-sm bg-surface-card text-ink outline-none focus:border-line-strong disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {showDropdown && !disabled && filteredOperators.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-line rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredOperators.map((operator) => (
            <button
              key={operator.id}
              type="button"
              onMouseDown={() => handleSelect(operator)}
              className="w-full text-left px-3 py-2 hover:bg-surface-sunken border-b border-line last:border-b-0 text-sm"
            >
              <div className="font-medium text-ink">{operator.name}</div>
              <div className="text-xs text-ink-muted">{operator.email}</div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !disabled && filteredOperators.length === 0 && searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-line rounded-lg shadow-lg z-10 p-3 text-sm text-ink-muted">
          Nincs találat
        </div>
      )}

      {selectedOperator && (
        <div className="mt-2 p-2 bg-surface-sunken rounded-lg border border-line">
          <div className="text-sm font-medium text-ink">{selectedOperator.name}</div>
          <div className="text-xs text-ink-muted">{selectedOperator.email}</div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { useEditLock } from '../../hooks/useEditLock'

interface EditableCellProps {
  rowId: string
  value: string | number
  onSave: (newValue: string) => void
  className?: string
  inputType?: 'text' | 'number'
  disabled?: boolean
}

/**
 * EditableCell
 *
 * Double-click to edit cell with localStorage-based conflict detection.
 * Supports Esc (cancel) and Enter (save) keyboard shortcuts.
 */
export function EditableCell({
  rowId,
  value,
  onSave,
  className = '',
  inputType = 'text',
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  const { hasConflict, isLocked, acquireLock, releaseLock } = useEditLock(
    isEditing ? rowId : null
  )

  // Sync tempValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setTempValue(String(value))
    }
  }, [value, isEditing])

  /**
   * Enter edit mode
   */
  const handleDoubleClick = () => {
    if (disabled || hasConflict) return

    const acquired = acquireLock()
    if (acquired) {
      setIsEditing(true)
      setTempValue(String(value))
    }
  }

  /**
   * Focus input when entering edit mode
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  /**
   * Save changes
   */
  const handleSave = () => {
    if (tempValue !== String(value)) {
      onSave(tempValue)
    }
    setIsEditing(false)
    releaseLock()
  }

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setTempValue(String(value))
    setIsEditing(false)
    releaseLock()
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  /**
   * Handle blur (click outside)
   */
  const handleBlur = () => {
    // Small delay to allow click events to fire
    setTimeout(() => {
      if (isEditing) {
        handleSave()
      }
    }, 100)
  }

  // If another tab has the lock, show conflict warning
  if (hasConflict && !isEditing) {
    return (
      <div
        className={`${className} px-2 py-1 cursor-not-allowed opacity-60 bg-amber-50/40 border border-amber-200/60 rounded`}
        title="Another tab is editing this cell"
      >
        <span className="text-[11px] text-amber-700">🔒 Locked</span>
      </div>
    )
  }

  // Edit mode
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={inputType}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${className} px-2 py-1 border-2 border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white`}
        disabled={!isLocked}
      />
    )
  }

  // Display mode
  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`${className} px-2 py-1 cursor-pointer hover:bg-stone-50/60 rounded transition ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
      title={disabled ? 'Editing disabled' : 'Double-click to edit'}
    >
      {value}
    </div>
  )
}

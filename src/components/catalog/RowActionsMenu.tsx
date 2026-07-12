import { useState, useRef, useEffect } from 'react'
import { Icon } from '../ui'

export interface RowActionsMenuProps {
  onDuplicate: () => void
  onDelete: () => void
  onEdit?: () => void
}

/**
 * RowActionsMenu
 *
 * Dropdown menu for row actions (duplicate, delete, edit).
 *
 * Features:
 * - Click outside to close
 * - Keyboard navigation (Esc to close)
 * - Mobile-friendly (44px touch target)
 */
export function RowActionsMenu({ onDuplicate, onDelete, onEdit }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  /**
   * Close menu on outside click
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * Close menu on Esc key
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-stone-100 active:bg-stone-200 transition"
        aria-label="Row actions"
      >
        <span className="text-stone-400 text-base leading-none">⋯</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 rounded-md shadow-lg z-10 py-1">
          {/* Duplicate */}
          <button
            onClick={() => handleAction(onDuplicate)}
            className="w-full px-3 py-2 text-left text-[12px] hover:bg-stone-50 flex items-center gap-2 transition"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-700">Duplicate</span>
            <kbd className="ml-auto px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-mono text-stone-500">
              ⌘D
            </kbd>
          </button>

          {/* Edit (optional) */}
          {onEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-3 py-2 text-left text-[12px] hover:bg-stone-50 flex items-center gap-2 transition"
            >
              <Icon name="edit" className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-700">Edit</span>
            </button>
          )}

          {/* Divider */}
          <div className="my-1 border-t border-stone-100" />

          {/* Delete */}
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-3 py-2 text-left text-[12px] hover:bg-red-50 flex items-center gap-2 transition"
          >
            <Icon name="trash" className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-600">Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

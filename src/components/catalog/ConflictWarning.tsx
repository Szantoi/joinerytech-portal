import { Icon } from '../ui/Icon'

interface ConflictWarningProps {
  rowId?: string
  onDismiss?: () => void
}

/**
 * ConflictWarning
 *
 * Banner component to warn user when another tab is editing a row.
 * Displays at the top of the table or page.
 */
export function ConflictWarning({ rowId, onDismiss }: ConflictWarningProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          <Icon name="alert" size={16} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-amber-900">
            Another tab is editing this row
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {rowId ? (
              <>
                Row <span className="font-mono">{rowId}</span> is locked by another browser tab.
                Close that tab or wait for the lock to expire.
              </>
            ) : (
              <>
                A row is locked by another browser tab. Editing is temporarily disabled.
              </>
            )}
          </div>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-amber-100 rounded transition"
          aria-label="Dismiss warning"
        >
          <Icon name="close" size={14} className="text-amber-600" />
        </button>
      )}
    </div>
  )
}

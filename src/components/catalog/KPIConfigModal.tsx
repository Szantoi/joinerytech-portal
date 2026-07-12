import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Card } from '../ui/Card'

interface KPIConfigModalProps {
  open: boolean
  currentOrder: string[]
  onSave: (newOrder: string[]) => void
  onClose: () => void
}

const KPI_LABELS: Record<string, string> = {
  'inventory-value': 'Készlet érték',
  'active-skus': 'Aktív termékek',
  'avg-price': 'Átlagár',
  'low-stock': 'Alacsony készlet',
}

/**
 * KPIConfigModal
 *
 * Modal for customizing KPI dashboard card order.
 * Uses simple up/down buttons (no drag-drop to avoid bundle size).
 */
export function KPIConfigModal({ open, currentOrder, onSave, onClose }: KPIConfigModalProps) {
  const [tempOrder, setTempOrder] = useState<string[]>(currentOrder)

  // Sync tempOrder when modal opens
  if (open && tempOrder !== currentOrder) {
    setTempOrder(currentOrder)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...tempOrder]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setTempOrder(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === tempOrder.length - 1) return
    const newOrder = [...tempOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setTempOrder(newOrder)
  }

  const handleSave = () => {
    onSave(tempOrder)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-0 shadow-xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-stone-900">KPI Dashboard beállítások</div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded-lg transition"
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-2">
            <div className="text-[11.5px] text-stone-500 mb-3">
              Állítsd be a KPI kártyák megjelenési sorrendjét
            </div>
            {tempOrder.map((kpiId, index) => (
              <div
                key={kpiId}
                className="flex items-center gap-3 p-3 bg-stone-50/60 rounded-lg border border-stone-200/60"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded transition ${
                      index === 0
                        ? 'text-stone-300 cursor-not-allowed'
                        : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                    }`}
                    aria-label="Move up"
                  >
                    <Icon name="up" size={14} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === tempOrder.length - 1}
                    className={`p-1 rounded transition ${
                      index === tempOrder.length - 1
                        ? 'text-stone-300 cursor-not-allowed'
                        : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                    }`}
                    aria-label="Move down"
                  >
                    <Icon name="down" size={14} />
                  </button>
                </div>
                <div className="flex-1 text-[13px] font-medium text-stone-900">
                  {KPI_LABELS[kpiId] || kpiId}
                </div>
                <div className="text-[11px] font-mono text-stone-400">#{index + 1}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-stone-200/80 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[12.5px] font-medium text-stone-600 hover:bg-stone-100/60 rounded-lg transition"
            >
              Mégse
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[12.5px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              Mentés
            </button>
          </div>
        </Card>
      </div>
    </>
  )
}

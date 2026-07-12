import { useState } from 'react'
import { KpiCard } from '../ui/KpiCard'
import { KPIConfigModal } from './KPIConfigModal'
import { useKPICalculator } from '../../hooks/useKPICalculator'
import type { KPIData } from '../../hooks/useKPICalculator'
import { useDashboardLayout } from '../../hooks/useDashboardLayout'
import { Icon } from '../ui/Icon'

interface KPIDashboardProps {
  data: KPIData
}

/**
 * KPIDashboard
 *
 * Displays KPI cards in a customizable grid layout.
 * Order is persisted in localStorage via useDashboardLayout hook.
 */
export function KPIDashboard({ data }: KPIDashboardProps) {
  const { layout, updateKpiOrder } = useDashboardLayout()
  const [showConfig, setShowConfig] = useState(false)

  // Calculate KPI metrics with trends from localStorage
  const metrics = useKPICalculator(data, layout.trends)

  // Sort metrics by user-defined order
  const orderedMetrics = layout.kpiOrder
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined)

  // Add any new metrics not in the order (future-proof)
  const unmappedMetrics = metrics.filter((m) => !layout.kpiOrder.includes(m.id))
  const allMetrics = [...orderedMetrics, ...unmappedMetrics]

  return (
    <div className="space-y-3">
      {/* Header with config button */}
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-stone-900">KPI Dashboard</div>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/60 rounded-lg transition"
          aria-label="Configure KPI Dashboard"
        >
          <Icon name="settings" size={14} />
          <span>Beállítások</span>
        </button>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {allMetrics.map((kpi) => (
          <KpiCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            delta={kpi.delta}
            spark={kpi.spark}
            breakdowns={kpi.breakdowns}
          />
        ))}
      </div>

      {/* Config Modal */}
      <KPIConfigModal
        open={showConfig}
        currentOrder={layout.kpiOrder}
        onSave={(newOrder) => {
          updateKpiOrder(newOrder)
          setShowConfig(false)
        }}
        onClose={() => setShowConfig(false)}
      />
    </div>
  )
}

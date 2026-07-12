import { useState, useEffect, useCallback } from 'react'

/**
 * localStorage schema for KPI Dashboard layout
 */
export interface DashboardLayout {
  kpiOrder: string[]
  trends: {
    [kpiId: string]: {
      [month: string]: number
    }
  }
}

const STORAGE_KEY = 'spaceos_dashboard_layout'

const DEFAULT_LAYOUT: DashboardLayout = {
  kpiOrder: ['inventory-value', 'active-skus', 'avg-price', 'low-stock'],
  trends: {},
}

/**
 * useDashboardLayout
 *
 * Manages KPI Dashboard layout state in localStorage.
 * Supports KPI ordering and trend history.
 */
export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_LAYOUT, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error)
    }
    return DEFAULT_LAYOUT
  })

  // Persist to localStorage whenever layout changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch (error) {
      console.error('Failed to save dashboard layout:', error)
    }
  }, [layout])

  /**
   * Update KPI order
   */
  const updateKpiOrder = useCallback((newOrder: string[]) => {
    setLayout((prev) => ({
      ...prev,
      kpiOrder: newOrder,
    }))
  }, [])

  /**
   * Record trend data point for a KPI
   * @param kpiId - KPI identifier
   * @param month - Month in YYYY-MM format
   * @param value - Numeric value
   */
  const recordTrend = useCallback((kpiId: string, month: string, value: number) => {
    setLayout((prev) => ({
      ...prev,
      trends: {
        ...prev.trends,
        [kpiId]: {
          ...prev.trends[kpiId],
          [month]: value,
        },
      },
    }))
  }, [])

  /**
   * Reset layout to defaults
   */
  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
  }, [])

  return {
    layout,
    updateKpiOrder,
    recordTrend,
    resetLayout,
  }
}

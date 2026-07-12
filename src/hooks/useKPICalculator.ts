import { useMemo } from 'react'

export interface KPIMetric {
  id: string
  label: string
  value: string
  unit?: string
  delta?: number
  spark?: number[]
  breakdowns?: Array<{ label: string; value: string; note?: string }>
}

export interface KPIData {
  'inventory-value': number
  'active-skus': number
  'avg-price': number
  'low-stock': number
}

interface KPITrend {
  [key: string]: { [month: string]: number }
}

/**
 * useKPICalculator
 *
 * Memoized KPI calculations from raw data.
 * Supports localStorage-based trend tracking.
 */
export function useKPICalculator(rawData: KPIData, trends?: KPITrend): KPIMetric[] {
  return useMemo(() => {
    const metrics: KPIMetric[] = []

    // 1. Inventory Value
    const inventoryValue = rawData['inventory-value']
    const inventoryTrend = trends?.['inventory-value']
    const inventoryDelta = calculateDelta(inventoryValue, inventoryTrend)
    metrics.push({
      id: 'inventory-value',
      label: 'Készlet érték',
      value: formatCurrency(inventoryValue),
      unit: 'Ft',
      delta: inventoryDelta,
      spark: inventoryTrend ? Object.values(inventoryTrend) : undefined,
    })

    // 2. Active SKUs
    const activeSkus = rawData['active-skus']
    const skuTrend = trends?.['active-skus']
    const skuDelta = calculateDelta(activeSkus, skuTrend)
    metrics.push({
      id: 'active-skus',
      label: 'Aktív termékek',
      value: activeSkus.toString(),
      unit: 'db',
      delta: skuDelta,
      spark: skuTrend ? Object.values(skuTrend) : undefined,
    })

    // 3. Average Price
    const avgPrice = rawData['avg-price']
    const priceTrend = trends?.['avg-price']
    const priceDelta = calculateDelta(avgPrice, priceTrend)
    metrics.push({
      id: 'avg-price',
      label: 'Átlagár',
      value: formatCurrency(avgPrice),
      unit: 'Ft',
      delta: priceDelta,
      spark: priceTrend ? Object.values(priceTrend) : undefined,
    })

    // 4. Low Stock Items
    const lowStock = rawData['low-stock']
    const lowStockTrend = trends?.['low-stock']
    const lowStockDelta = calculateDelta(lowStock, lowStockTrend)
    metrics.push({
      id: 'low-stock',
      label: 'Alacsony készlet',
      value: lowStock.toString(),
      unit: 'db',
      delta: lowStockDelta,
      spark: lowStockTrend ? Object.values(lowStockTrend) : undefined,
      breakdowns: [
        { label: 'Kritikus', value: Math.floor(lowStock * 0.3).toString() },
        { label: 'Figyelmeztetés', value: Math.floor(lowStock * 0.7).toString() },
      ],
    })

    return metrics
  }, [rawData, trends])
}

/**
 * Calculate delta percentage from current value and historical trend
 */
function calculateDelta(current: number, trend?: { [month: string]: number }): number | undefined {
  if (!trend) return undefined

  const values = Object.values(trend)
  if (values.length < 2) return undefined

  const previous = values[values.length - 2]
  if (previous === 0) return undefined

  const delta = ((current - previous) / previous) * 100
  return Math.round(delta * 10) / 10 // Round to 1 decimal
}

/**
 * Format number as currency (Hungarian locale)
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace('.', ',') + 'M'
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(0) + 'K'
  }
  return value.toString()
}

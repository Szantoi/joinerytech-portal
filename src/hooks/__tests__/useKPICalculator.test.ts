import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKPICalculator } from '../useKPICalculator'
import type { KPIData } from '../useKPICalculator'

describe('useKPICalculator', () => {
  const mockData: KPIData = {
    'inventory-value': 12_400_000,
    'active-skus': 847,
    'avg-price': 15_200,
    'low-stock': 23,
  }

  it('should calculate KPI metrics without trends', () => {
    const { result } = renderHook(() => useKPICalculator(mockData))

    expect(result.current).toHaveLength(4)

    // Check inventory-value
    const inventoryKpi = result.current.find(k => k.id === 'inventory-value')
    expect(inventoryKpi).toBeDefined()
    expect(inventoryKpi?.label).toBe('Készlet érték')
    expect(inventoryKpi?.value).toBe('12,4M')
    expect(inventoryKpi?.unit).toBe('Ft')
    expect(inventoryKpi?.delta).toBeUndefined()

    // Check active-skus
    const skuKpi = result.current.find(k => k.id === 'active-skus')
    expect(skuKpi).toBeDefined()
    expect(skuKpi?.label).toBe('Aktív termékek')
    expect(skuKpi?.value).toBe('847')
    expect(skuKpi?.unit).toBe('db')

    // Check avg-price
    const priceKpi = result.current.find(k => k.id === 'avg-price')
    expect(priceKpi).toBeDefined()
    expect(priceKpi?.label).toBe('Átlagár')
    expect(priceKpi?.value).toBe('15K')
    expect(priceKpi?.unit).toBe('Ft')

    // Check low-stock
    const lowStockKpi = result.current.find(k => k.id === 'low-stock')
    expect(lowStockKpi).toBeDefined()
    expect(lowStockKpi?.label).toBe('Alacsony készlet')
    expect(lowStockKpi?.value).toBe('23')
    expect(lowStockKpi?.unit).toBe('db')
    expect(lowStockKpi?.breakdowns).toHaveLength(2)
  })

  it('should calculate delta percentage from trends', () => {
    const trends = {
      'inventory-value': {
        '2026-05': 11_500_000,
        '2026-06': 12_400_000,
      },
    }

    const { result } = renderHook(() => useKPICalculator(mockData, trends))

    const inventoryKpi = result.current.find(k => k.id === 'inventory-value')
    expect(inventoryKpi?.delta).toBeDefined()
    // (12.4M - 11.5M) / 11.5M * 100 = 7.8%
    expect(inventoryKpi?.delta).toBeCloseTo(7.8, 0)
  })

  it('should handle negative delta', () => {
    const trends = {
      'avg-price': {
        '2026-05': 18_000,
        '2026-06': 15_200,
      },
    }

    const { result } = renderHook(() => useKPICalculator(mockData, trends))

    const priceKpi = result.current.find(k => k.id === 'avg-price')
    expect(priceKpi?.delta).toBeDefined()
    // (15.2K - 18K) / 18K * 100 = -15.6%
    expect(priceKpi?.delta).toBeLessThan(0)
    expect(priceKpi?.delta).toBeCloseTo(-15.6, 0)
  })

  it('should format currency with M suffix for millions', () => {
    const { result } = renderHook(() => useKPICalculator(mockData))
    const inventoryKpi = result.current.find(k => k.id === 'inventory-value')
    expect(inventoryKpi?.value).toBe('12,4M')
  })

  it('should format currency with K suffix for thousands', () => {
    const { result } = renderHook(() => useKPICalculator(mockData))
    const priceKpi = result.current.find(k => k.id === 'avg-price')
    expect(priceKpi?.value).toBe('15K')
  })

  it('should include sparkline data from trends', () => {
    const trends = {
      'active-skus': {
        '2026-01': 750,
        '2026-02': 780,
        '2026-03': 810,
        '2026-04': 820,
        '2026-05': 835,
        '2026-06': 847,
      },
    }

    const { result } = renderHook(() => useKPICalculator(mockData, trends))

    const skuKpi = result.current.find(k => k.id === 'active-skus')
    expect(skuKpi?.spark).toBeDefined()
    expect(skuKpi?.spark).toEqual([750, 780, 810, 820, 835, 847])
  })

  it('should memoize results when data does not change', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useKPICalculator(data),
      { initialProps: { data: mockData } }
    )

    const firstResult = result.current

    // Re-render with same data
    rerender({ data: mockData })

    // Should return same reference (memoized)
    expect(result.current).toBe(firstResult)
  })

  it('should recalculate when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useKPICalculator(data),
      { initialProps: { data: mockData } }
    )

    const firstResult = result.current

    // Change data
    const newData: KPIData = {
      ...mockData,
      'inventory-value': 15_000_000,
    }

    rerender({ data: newData })

    // Should return different reference
    expect(result.current).not.toBe(firstResult)

    const inventoryKpi = result.current.find(k => k.id === 'inventory-value')
    expect(inventoryKpi?.value).toBe('15,0M')
  })
})

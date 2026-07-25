import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filter field configuration
 */
export interface FilterField {
  id: string
  label: string
  type: 'text' | 'multiselect' | 'daterange' | 'number'
  options?: Array<{ value: string; label: string }>
}

/**
 * Filter operator configuration
 */
export interface FilterOperators {
  text: string[]
  multiselect: string[]
  daterange: string[]
  number: string[]
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  fields: FilterField[]
  operators: FilterOperators
}

/**
 * Active filter row
 */
export interface FilterRow {
  id: string
  field: string
  operator: string
  value: any
}

/**
 * Filter preset stored in localStorage
 */
export interface FilterPreset {
  id: string
  name: string
  filters: FilterRow[]
  createdAt: string
}

const STORAGE_KEY = 'spaceos_filter_presets'
const MAX_PRESETS = 10

/**
 * Két szűrősor-lista ÉRDEMI egyezése (a generált `id` mezőt figyelmen kívül
 * hagyva) — az URL→state hatás azonosság-guardja használja.
 */
function sameFilterRows(a: FilterRow[], b: FilterRow[]): boolean {
  if (a.length !== b.length) return false
  return a.every((row, i) => {
    const other = b[i]
    return (
      row.field === other.field &&
      row.operator === other.operator &&
      JSON.stringify(row.value) === JSON.stringify(other.value)
    )
  })
}

/**
 * useFilterState
 *
 * Core filter state management hook with URL sync and localStorage presets.
 *
 * Features:
 * - URL params as single source of truth
 * - localStorage preset save/load
 * - Memoized filter logic
 * - Config-driven architecture
 *
 * @param config - Filter configuration (fields + operators)
 * @param data - Data array to filter
 * @param presetKey - Unique key for localStorage presets (e.g., 'rfq', 'orders')
 */
export function useFilterState<T = any>(
  config: FilterConfig,
  data: T[],
  presetKey: string
) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeFilters, setActiveFilters] = useState<FilterRow[]>([])
  const [presets, setPresets] = useState<FilterPreset[]>([])

  /**
   * Load presets from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${presetKey}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPresets(parsed)
      }
    } catch (err) {
      console.warn('Failed to load filter presets from localStorage', err)
    }
  }, [presetKey])

  /**
   * Sync URL params → activeFilters state
   * URL is master, state follows URL
   */
  useEffect(() => {
    const filters: FilterRow[] = []

    searchParams.forEach((value, key) => {
      // Parse URL param: key=field__operator, value=encoded value
      const parts = key.split('__')
      if (parts.length === 2) {
        const [field, operator] = parts
        const fieldConfig = config.fields.find((f) => f.id === field)
        if (fieldConfig) {
          // Decode value based on field type
          let decodedValue: any = value
          if (fieldConfig.type === 'multiselect') {
            decodedValue = value.split(',')
          } else if (fieldConfig.type === 'number') {
            decodedValue = parseFloat(value)
          } else if (fieldConfig.type === 'daterange') {
            // daterange format: "2026-01-01:2026-12-31"
            const [start, end] = value.split(':')
            decodedValue = { start, end }
          }

          filters.push({
            id: `${field}-${operator}-${Date.now()}`,
            field,
            operator,
            value: decodedValue,
          })
        }
      }
    })

    // ⚠ Azonosság-guard (STAB-FE-PROCUREMENT-OOM): a `filters` MINDEN futáskor
    // új tömb (a sor-id-k `Date.now()`-ból készülnek), ezért a feltétel nélküli
    // setState új rendert indítana, az pedig — inline `config` literált átadó
    // fogyasztónál — újra lefuttatná ezt a hatást: végtelen hurok. Csak akkor
    // frissítünk, ha a szűrők ÉRDEMBEN változtak (az id-k figyelmen kívül).
    setActiveFilters((prev) => (sameFilterRows(prev, filters) ? prev : filters))
    // A `searchParams` OBJEKTUM-identitása renderenként változhat; a
    // string-alakja viszont pontosan akkor, amikor a tartalom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), config.fields])

  /**
   * Update URL params when filters change
   */
  const updateUrlParams = useCallback(
    (filters: FilterRow[]) => {
      const newParams = new URLSearchParams()

      filters.forEach((filter) => {
        const key = `${filter.field}__${filter.operator}`
        let value: string

        // Encode value based on type
        if (Array.isArray(filter.value)) {
          value = filter.value.join(',')
        } else if (typeof filter.value === 'object' && filter.value.start) {
          // daterange
          value = `${filter.value.start}:${filter.value.end || ''}`
        } else {
          value = String(filter.value)
        }

        newParams.set(key, value)
      })

      setSearchParams(newParams, { replace: true })
    },
    [setSearchParams]
  )

  /**
   * Add a new filter row
   */
  const addFilter = useCallback(
    (field: string, operator: string, value: any) => {
      const newFilter: FilterRow = {
        id: `${field}-${operator}-${Date.now()}`,
        field,
        operator,
        value,
      }
      const updated = [...activeFilters, newFilter]
      setActiveFilters(updated)
      updateUrlParams(updated)
    },
    [activeFilters, updateUrlParams]
  )

  /**
   * Remove a filter row
   */
  const removeFilter = useCallback(
    (filterId: string) => {
      const updated = activeFilters.filter((f) => f.id !== filterId)
      setActiveFilters(updated)
      updateUrlParams(updated)
    },
    [activeFilters, updateUrlParams]
  )

  /**
   * Update a filter row
   */
  const updateFilter = useCallback(
    (filterId: string, updates: Partial<FilterRow>) => {
      const updated = activeFilters.map((f) =>
        f.id === filterId ? { ...f, ...updates } : f
      )
      // Bail-out (STAB-FE-PROCUREMENT-OOM, második kör): a `.map()` MINDIG új
      // tömb-identitást ad, ezért a feltétel nélküli setState akkor is új
      // rendert indít, ha semmi nem változott — és ezzel a hívó hatását is
      // újrafuttatja. Az `updateUrlParams` ráadásul `setSearchParams`-t hív,
      // ami böngészőben `history.replaceState`-spamot okozna.
      if (sameFilterRows(activeFilters, updated)) return
      setActiveFilters(updated)
      updateUrlParams(updated)
    },
    [activeFilters, updateUrlParams]
  )

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters([])
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  /**
   * Save current filters as a preset
   */
  const savePreset = useCallback(
    (name: string) => {
      const newPreset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name,
        filters: activeFilters,
        createdAt: new Date().toISOString(),
      }

      const updated = [newPreset, ...presets].slice(0, MAX_PRESETS)
      setPresets(updated)

      try {
        localStorage.setItem(`${STORAGE_KEY}_${presetKey}`, JSON.stringify(updated))
      } catch (err) {
        console.warn('Failed to save preset to localStorage', err)
      }
    },
    [activeFilters, presets, presetKey]
  )

  /**
   * Load a preset
   */
  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId)
      if (preset) {
        setActiveFilters(preset.filters)
        updateUrlParams(preset.filters)
      }
    },
    [presets, updateUrlParams]
  )

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(
    (presetId: string) => {
      const updated = presets.filter((p) => p.id !== presetId)
      setPresets(updated)

      try {
        localStorage.setItem(`${STORAGE_KEY}_${presetKey}`, JSON.stringify(updated))
      } catch (err) {
        console.warn('Failed to delete preset from localStorage', err)
      }
    },
    [presets, presetKey]
  )

  /**
   * Apply filters to data
   * Memoized to prevent unnecessary recalculations
   */
  const filteredData = useMemo(() => {
    if (activeFilters.length === 0) {
      return data
    }

    return data.filter((item) => {
      // All filters must pass (AND logic)
      return activeFilters.every((filter) => {
        const fieldValue = (item as any)[filter.field]

        switch (filter.operator) {
          case 'IN':
            return Array.isArray(filter.value) && filter.value.includes(fieldValue)
          case 'NOT IN':
            return Array.isArray(filter.value) && !filter.value.includes(fieldValue)
          case '=':
            return fieldValue === filter.value
          case '!=':
            return fieldValue !== filter.value
          case '>':
            return fieldValue > filter.value
          case '<':
            return fieldValue < filter.value
          case '>=':
            return fieldValue >= filter.value
          case '<=':
            return fieldValue <= filter.value
          case 'BETWEEN':
            if (filter.value.start && filter.value.end) {
              return fieldValue >= filter.value.start && fieldValue <= filter.value.end
            }
            return true
          case 'CONTAINS':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
          default:
            return true
        }
      })
    })
  }, [data, activeFilters])

  return {
    activeFilters,
    filteredData,
    presets,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    savePreset,
    loadPreset,
    deletePreset,
  }
}

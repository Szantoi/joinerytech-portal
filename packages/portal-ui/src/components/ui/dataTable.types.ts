import type { ReactNode } from 'react'

/**
 * Shared types for the DataTable primitive (DESIGN_SYSTEM_SPEC_V1 §2.4).
 * Kept in their own module so the table and card renderers can share them
 * without a circular import.
 */

export type SortDirection = 'ascending' | 'descending'

export interface SortState {
  /** Column key currently sorted by. */
  key: string
  direction: SortDirection
}

/** One column definition drives BOTH renders (≥md table, <md card list). */
export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  /** Cell content. Row actions (links/buttons) belong in the title cell's render. */
  render: (row: T) => ReactNode
  /**
   * Comparable value for internal sorting. When omitted on a sortable column,
   * sorting is delegated to the consumer via onSortChange (external sorting).
   */
  sortValue?: (row: T) => string | number | Date | null | undefined
  /** Role in the mobile card render: 'title' = card heading, 'meta' = label–value pair (default), 'hidden' = omitted. */
  mobile?: 'title' | 'meta' | 'hidden'
}

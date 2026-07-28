import { useId, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { DataTableCards } from './DataTableCards'
import type { DataTableColumn, SortState } from './dataTable.types'

/**
 * DataTable — responsive dual-render list primitive (DESIGN_SYSTEM_SPEC_V1 §2.4).
 *
 * ONE column definition, TWO renders (mobile-first root decision):
 * - ≥ md: real <table> semantics — sr-only <caption>, th[scope=col], aria-sort on
 *   sortable headers (full-width button, cycle none → ascending → descending → none),
 *   sort changes announced via a polite live region. Horizontal overflow scrolls
 *   inside a focusable role="region" container.
 * - < md: <ul> card list rendering the same row model (see DataTableCards).
 *
 * Sorting is uncontrolled by default (needs `sortValue` on the column); pass
 * `sort` + `onSortChange` to control it externally (e.g. server-side sorting).
 */

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Stable row identity for React keys. */
  rowKey: (row: T) => string
  /** What the table lists — becomes the sr-only <caption> and the region label. */
  caption: string
  emptyMessage?: string
  /** Optional primary action rendered in the empty state. */
  emptyAction?: ReactNode
  /** Controlled sort state (optional — omit for internal sorting). */
  sort?: SortState | null
  onSortChange?: (sort: SortState | null) => void
  className?: string
}

const DIRECTION_LABELS: Record<SortState['direction'], string> = {
  ascending: 'növekvő',
  descending: 'csökkenő',
}

/** null/undefined last; numbers/dates numerically, strings via localeCompare. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  return String(a).localeCompare(String(b), 'hu')
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyMessage = 'Nincs megjeleníthető elem.',
  emptyAction,
  sort: controlledSort,
  onSortChange,
  className = '',
}: DataTableProps<T>) {
  const sortSelectId = useId()
  const [internalSort, setInternalSort] = useState<SortState | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const isControlled = controlledSort !== undefined
  const sort = isControlled ? controlledSort : internalSort

  const applySort = (next: SortState | null) => {
    if (!isControlled) setInternalSort(next)
    onSortChange?.(next)
    // Announce the change for screen reader users (spec: aria-live).
    if (next) {
      const header = columns.find((c) => c.key === next.key)?.header ?? next.key
      setAnnouncement(`Rendezve: ${header}, ${DIRECTION_LABELS[next.direction]}`)
    } else {
      setAnnouncement('Rendezés törölve')
    }
  }

  /** Header button click cycle: none → ascending → descending → none. */
  const cycleSort = (key: string) => {
    if (sort?.key !== key) applySort({ key, direction: 'ascending' })
    else if (sort.direction === 'ascending') applySort({ key, direction: 'descending' })
    else applySort(null)
  }

  // Internal sorting only when the sorted column provides a comparable value;
  // otherwise the consumer is expected to deliver pre-sorted rows.
  const sortColumn = sort ? columns.find((c) => c.key === sort.key) : undefined
  const sortedRows =
    sort && sortColumn?.sortValue
      ? [...rows].sort((a, b) => {
          const cmp = compareValues(sortColumn.sortValue!(a), sortColumn.sortValue!(b))
          return sort.direction === 'ascending' ? cmp : -cmp
        })
      : rows

  return (
    <div className={className}>
      {/* Sort announcements — persistent polite live region */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface-1 px-4 py-10 text-center">
          <p className="text-[12.5px] text-ink-muted">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <>
          {/* ≥ md: semantic table inside a focusable, labelled scroll region */}
          <div
            role="region"
            aria-label={caption}
            tabIndex={0}
            className="hidden overflow-x-auto rounded-xl border border-line bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring md:block"
          >
            <table className="w-full text-left text-[12.5px]">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={col.sortable ? (sort?.key === col.key ? sort.direction : 'none') : undefined}
                      className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          aria-label={`Rendezés: ${col.header}`}
                          onClick={() => cycleSort(col.key)}
                          className="-mx-1 flex w-full items-center gap-1 rounded px-1 py-0.5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                        >
                          {col.header}
                          <span aria-hidden="true" className={sort?.key === col.key ? '' : 'opacity-30'}>
                            <Icon name={sort?.key === col.key && sort.direction === 'descending' ? 'down' : 'up'} size={12} />
                          </span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  // Rows are NOT clickable <tr>s — actions live inside the title
                  // cell's render (link/button stays the focusable element).
                  <tr key={rowKey(row)} className="border-b border-line last:border-b-0 hover:bg-surface-2/50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2 text-ink">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* < md: card list from the same row model */}
          <DataTableCards
            columns={columns}
            rows={sortedRows}
            rowKey={rowKey}
            sort={sort ?? null}
            onSortChange={applySort}
            sortSelectId={sortSelectId}
          />
        </>
      )}
    </div>
  )
}

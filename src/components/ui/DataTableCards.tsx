import type { DataTableColumn, SortState } from './dataTable.types'

/**
 * DataTableCards — the <md render of DataTable (DESIGN_SYSTEM_SPEC_V1 §2.4).
 *
 * Renders the SAME row model as the table as a <ul> card list:
 * - the column marked mobile:'title' (fallback: first column) becomes the card heading,
 * - mobile:'meta' columns render as label–value pairs,
 * - mobile:'hidden' columns are omitted,
 * - sorting is exposed as a labelled <select> above the list (the <th> sort
 *   buttons do not exist in card view).
 */

interface DataTableCardsProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort: SortState | null
  onSortChange: (sort: SortState | null) => void
  sortSelectId: string
}

export function DataTableCards<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  sortSelectId,
}: DataTableCardsProps<T>) {
  const titleColumn = columns.find((c) => c.mobile === 'title') ?? columns[0]
  const metaColumns = columns.filter((c) => c !== titleColumn && c.mobile !== 'hidden')
  const sortableColumns = columns.filter((c) => c.sortable)

  const sortValue = sort ? `${sort.key}:${sort.direction}` : ''
  const handleSortSelect = (value: string) => {
    if (!value) {
      onSortChange(null)
      return
    }
    const [key, direction] = value.split(':') as [string, SortState['direction']]
    onSortChange({ key, direction })
  }

  return (
    <div className="md:hidden">
      {sortableColumns.length > 0 && (
        <div className="mb-2 flex items-center justify-end gap-2">
          <label htmlFor={sortSelectId} className="text-[11.5px] text-ink-muted">
            Rendezés
          </label>
          <select
            id={sortSelectId}
            value={sortValue}
            onChange={(e) => handleSortSelect(e.target.value)}
            className="h-8 rounded-md border border-line bg-surface-1 px-2 text-[12px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
          >
            <option value="">Alapértelmezett</option>
            {sortableColumns.map((col) => (
              <optgroup key={col.key} label={col.header}>
                <option value={`${col.key}:ascending`}>{col.header} — növekvő</option>
                <option value={`${col.key}:descending`}>{col.header} — csökkenő</option>
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-xl border border-line bg-surface-1 p-3 shadow-sm">
            <div className="text-[13px] font-semibold text-ink">{titleColumn.render(row)}</div>
            {metaColumns.length > 0 && (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {metaColumns.map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[10.5px] uppercase tracking-wide text-ink-muted">{col.header}</dt>
                    <dd className="text-[12px] text-ink">{col.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

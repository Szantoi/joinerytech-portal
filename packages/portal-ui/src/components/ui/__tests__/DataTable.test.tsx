import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DataTable } from '../DataTable'
import type { DataTableColumn } from '../dataTable.types'

interface Row {
  id: string
  name: string
  due: number
}

const ROWS: Row[] = [
  { id: '1', name: 'Csiszolás', due: 3 },
  { id: '2', name: 'Alapozás', due: 1 },
  { id: '3', name: 'Bútorlap szabás', due: 2 },
]

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Név', render: (r) => r.name, sortable: true, sortValue: (r) => r.name, mobile: 'title' },
  { key: 'due', header: 'Határidő', render: (r) => `${r.due} nap`, sortable: true, sortValue: (r) => r.due },
]

function renderTable() {
  return render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} caption="Feladatok listája" />)
}

/** Data row names in the current table order. */
function tableRowNames() {
  const table = screen.getByRole('table')
  return within(table)
    .getAllByRole('row')
    .slice(1) // skip header row
    .map((row) => within(row).getAllByRole('cell')[0].textContent)
}

describe('DataTable — table render (≥ md)', () => {
  it('renders semantic table: caption, th[scope=col], labelled scroll region', () => {
    renderTable()
    const region = screen.getByRole('region', { name: 'Feladatok listája' })
    expect(region).toHaveAttribute('tabindex', '0')
    const table = screen.getByRole('table', { name: 'Feladatok listája' })
    const headers = within(table).getAllByRole('columnheader')
    expect(headers).toHaveLength(2)
    headers.forEach((th) => expect(th).toHaveAttribute('scope', 'col'))
  })

  it('sortable headers expose aria-sort and a "Rendezés: …" button', () => {
    renderTable()
    const th = screen.getAllByRole('columnheader')[0]
    expect(th).toHaveAttribute('aria-sort', 'none')
    expect(within(th).getByRole('button', { name: 'Rendezés: Név' })).toBeTruthy()
  })

  it('cycles none → ascending → descending → none and reorders rows', () => {
    renderTable()
    const [nameTh] = screen.getAllByRole('columnheader')
    const sortBtn = within(nameTh).getByRole('button', { name: 'Rendezés: Név' })

    fireEvent.click(sortBtn)
    expect(nameTh).toHaveAttribute('aria-sort', 'ascending')
    expect(tableRowNames()).toEqual(['Alapozás', 'Bútorlap szabás', 'Csiszolás'])

    fireEvent.click(sortBtn)
    expect(nameTh).toHaveAttribute('aria-sort', 'descending')
    expect(tableRowNames()).toEqual(['Csiszolás', 'Bútorlap szabás', 'Alapozás'])

    fireEvent.click(sortBtn)
    expect(nameTh).toHaveAttribute('aria-sort', 'none')
    expect(tableRowNames()).toEqual(['Csiszolás', 'Alapozás', 'Bútorlap szabás']) // original order
  })

  it('announces sort changes in a live region', () => {
    const { container } = renderTable()
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement
    expect(live).toBeInTheDocument() // present before any interaction

    fireEvent.click(screen.getByRole('button', { name: 'Rendezés: Határidő' }))
    expect(live).toHaveTextContent('Rendezve: Határidő, növekvő')

    fireEvent.click(screen.getByRole('button', { name: 'Rendezés: Határidő' }))
    expect(live).toHaveTextContent('Rendezve: Határidő, csökkenő')

    fireEvent.click(screen.getByRole('button', { name: 'Rendezés: Határidő' }))
    expect(live).toHaveTextContent('Rendezés törölve')
  })

  it('sorts numerically via sortValue', () => {
    renderTable()
    fireEvent.click(screen.getByRole('button', { name: 'Rendezés: Határidő' }))
    expect(tableRowNames()).toEqual(['Alapozás', 'Bútorlap szabás', 'Csiszolás'])
  })
})

describe('DataTable — card render (< md)', () => {
  it('renders the same rows as a card list with the title column as heading', () => {
    renderTable()
    const list = screen.getByRole('list')
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(3)
    expect(within(cards[0]).getByText('Csiszolás')).toBeTruthy()
    // meta column rendered as label–value pair
    expect(within(cards[0]).getByText('Határidő')).toBeTruthy()
    expect(within(cards[0]).getByText('3 nap')).toBeTruthy()
  })

  it('exposes sorting as a labelled select that drives the shared sort state', () => {
    renderTable()
    const select = screen.getByLabelText('Rendezés')
    fireEvent.change(select, { target: { value: 'due:descending' } })
    // shared sort state also flips the table header
    expect(screen.getAllByRole('columnheader')[1]).toHaveAttribute('aria-sort', 'descending')
    const cards = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(within(cards[0]).getByText('Csiszolás')).toBeTruthy()
  })

  it('omits mobile:hidden columns from cards but keeps them in the table', () => {
    const columns: DataTableColumn<Row>[] = [
      ...COLUMNS.map((c) => (c.key === 'due' ? { ...c, mobile: 'hidden' as const } : c)),
    ]
    render(<DataTable columns={columns} rows={ROWS} rowKey={(r) => r.id} caption="Lista" />)
    const cards = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(within(cards[0]).queryByText('3 nap')).toBeNull()
    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(2)
  })
})

describe('DataTable — empty state', () => {
  it('renders the empty message and optional action instead of the table', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(r: Row) => r.id}
        caption="Lista"
        emptyMessage="Nincs feladat."
        emptyAction={<button>Új feladat</button>}
      />,
    )
    expect(screen.getByText('Nincs feladat.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Új feladat' })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})

import { Icon } from '../ui'
import { fmtHUF } from '../../lib/utils'
import type { MaterialReqItem } from '../../types/joinery.types'

interface MaterialRequisitionTableProps {
  materials: MaterialReqItem[]
  loading: boolean
  totalCost: number
  isMock?: boolean
}

const STATUS_STYLES: Record<MaterialReqItem['status'], { bg: string; text: string; label: string }> = {
  'in-stock': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Készleten' },
  'on-order': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Rendelésben' },
  'insufficient': { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Hiány' },
}

const MATERIAL_TYPE_LABELS: Record<MaterialReqItem['materialType'], string> = {
  wood: 'Faanyag',
  hardware: 'Vasalat',
  finishing: 'Felület',
}

export function MaterialRequisitionTable({ materials, loading, totalCost, isMock }: MaterialRequisitionTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-stone-200/70 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <span className="text-[12px] text-stone-500">Anyaglista betöltése...</span>
        </div>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="bg-white border border-stone-200/70 rounded-lg p-6">
        <div className="text-center text-[12px] text-stone-400">
          Nincs anyaglista adat
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200/70 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="text-[12.5px] font-semibold text-stone-900">Anyaglista</div>
          {isMock && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              Mock adat
            </span>
          )}
        </div>
        <span className="text-[10.5px] text-emerald-700 inline-flex items-center gap-1">
          <Icon name="check" size={10} />generálva
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/60">
              <th className="text-left px-4 py-2 font-medium">Anyag</th>
              <th className="text-left px-4 py-2 font-medium">Típus</th>
              <th className="text-right px-4 py-2 font-medium">Mennyiség</th>
              <th className="text-right px-4 py-2 font-medium">Egységár</th>
              <th className="text-right px-4 py-2 font-medium">Összesen</th>
              <th className="text-center px-4 py-2 font-medium">Készlet</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const statusStyle = STATUS_STYLES[m.status]
              const lineTotal = m.quantity * m.unitPrice
              return (
                <tr key={m.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
                  <td className="px-4 py-2.5">
                    <div className="text-[12px] font-medium text-stone-900">{m.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{m.id}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] text-stone-600">{MATERIAL_TYPE_LABELS[m.materialType]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[12px] text-stone-900 tabular-nums">
                      {m.quantity} {m.unit === 'piece' ? 'db' : m.unit === 'meter' ? 'm' : 'kg'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[11px] text-stone-600 tabular-nums">{fmtHUF(m.unitPrice)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[12px] font-medium text-stone-900 tabular-nums">{fmtHUF(lineTotal)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {m.status === 'in-stock' && <Icon name="check" size={9} />}
                      {m.status === 'on-order' && <Icon name="truck" size={9} />}
                      {m.status === 'insufficient' && <Icon name="alert" size={9} />}
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-stone-50/80 border-t border-stone-200">
              <td colSpan={4} className="px-4 py-2.5 text-right text-[11px] font-medium text-stone-700">
                Becsült anyagköltség:
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="text-[13px] font-semibold text-stone-900 tabular-nums">{fmtHUF(totalCost)}</span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

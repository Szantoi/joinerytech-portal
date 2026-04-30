import { useState } from 'react'
import { Card, StatusPill, PrimaryBtn, GhostBtn, Icon } from '../components/ui'
import { ORDERS, I18N } from '../mocks/data'
import { fmtHUF } from '../lib/utils'
import type { Order, OrderType } from '../types'

export function OrdersPage() {
  const t = I18N.hu
  const [filter, setFilter] = useState<OrderType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === 'all' ? ORDERS : ORDERS.filter((o) => o.type === filter)

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900">{t.orders.title}</h2>
          <p className="text-[12px] text-stone-500 mt-0.5">{t.orders.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <GhostBtn icon="filter">Szűrés</GhostBtn>
          <PrimaryBtn icon="plus">{t.orders.newOrder}</PrimaryBtn>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'door', 'cabinet', 'window', 'custom'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
              filter === f ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f === 'all' ? 'Mind' : t.orders.types[f]}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200/60">
              {['id', 'customer', 'type', 'date', 'total', 'status'].map((col) => (
                <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">
                  {t.orders.cols[col]}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((o: Order) => (
              <OrderRow
                key={o.id}
                order={o}
                t={t}
                expanded={expandedId === o.id}
                onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
              />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

interface OrderRowProps {
  order: Order
  t: typeof I18N.hu
  expanded: boolean
  onToggle: () => void
}

function OrderRow({ order, t, expanded, onToggle }: OrderRowProps) {
  return (
    <>
      <tr className="hover:bg-stone-50/50 cursor-pointer" onClick={onToggle}>
        <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{order.id}</td>
        <td className="px-5 py-3 text-[12.5px] text-stone-700">{order.customer}</td>
        <td className="px-5 py-3 text-[12px] text-stone-500">{t.orders.types[order.type]}</td>
        <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{order.date}</td>
        <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{fmtHUF(order.total)}</td>
        <td className="px-5 py-3">
          <StatusPill status={order.status} label={t.status[order.status]} />
        </td>
        <td className="px-3 py-3">
          <Icon name={expanded ? 'up' : 'down'} size={14} className="text-stone-400" />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-5 py-4 bg-stone-50/60">
            <div className="grid grid-cols-3 gap-4 text-[12px]">
              <div>
                <span className="text-stone-500">Tételek: </span>
                <span className="font-medium text-stone-800">{order.items} db</span>
              </div>
              <div>
                <span className="text-stone-500">Típus: </span>
                <span className="font-medium text-stone-800">{t.orders.types[order.type]}</span>
              </div>
              <div>
                <span className="text-stone-500">Állapot: </span>
                <span className="font-medium text-stone-800">{t.status[order.status]}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

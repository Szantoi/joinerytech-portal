import { useState, useEffect, useMemo } from 'react'
import { Card, StatusPill, PrimaryBtn, GhostBtn, Icon } from '../components/ui'
import { NewOrderDrawer } from '../components/orders/NewOrderDrawer'
import { MaterialRequisitionTable } from '../components/orders/MaterialRequisitionTable'
import { HardwareSpecsCard } from '../components/orders/HardwareSpecsCard'
import { I18N } from '../mocks/data'
import { fmtHUF } from '../lib/utils'
import { useApi, API_BASE } from '../hooks/useApi'
import { useMaterialReq } from '../hooks/useMaterialReq'
import { useHardwareSpecs } from '../hooks/useHardwareSpecs'
import type { Order, OrderStatus } from '../types'

interface ApiDoorOrder {
  id: string
  projectId: string
  projectName: string
  status: string
  itemCount: number
  deliveryDate: string | null
  createdAt: string
}

interface ApiOrdersPage {
  items: ApiDoorOrder[]
  totalCount: number
}

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  Draft:             'draft',
  Submitted:         'calc',
  Calculating:       'calc',
  Calculated:        'ready',
  CalculationFailed: 'draft',
  InProduction:      'released',
  Completed:         'released',
  Cancelled:         'draft',
}

interface FeOrderWithUuid extends Order {
  uuid: string  // Real order UUID for API calls
}

function apiOrderToFe(o: ApiDoorOrder): FeOrderWithUuid {
  const date = o.deliveryDate?.slice(0, 10)
    ?? (o.createdAt && !o.createdAt.startsWith('0001') ? o.createdAt.slice(0, 10) : '—')
  return {
    id: o.projectId || o.id.slice(0, 12).toUpperCase(),
    uuid: o.id,  // Store the real UUID for API calls
    customer: o.projectName,
    type: 'door' as const,
    date,
    status: ORDER_STATUS_MAP[o.status] ?? 'draft',
    total: 0,
    items: o.itemCount,
  }
}

type FilterKey = 'all' | 'draft' | 'calc' | 'ready' | 'released'

export function OrdersPage() {
  const t = I18N.hu
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  // Local calc/release simulation state: orderId → 'calculating' | 'ready' | 'released'
  const [orderFlow, setOrderFlow] = useState<Record<string, OrderStatus>>({})

  const { data: apiPage, refetch } = useApi<ApiOrdersPage>(
    `${API_BASE.joinery}/api/orders?pageSize=50`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayOrders: FeOrderWithUuid[] = apiPage?.items?.map(apiOrderToFe) ?? []

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: displayOrders.length }
    displayOrders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1 })
    return c
  }, [displayOrders])

  const filtered = filter === 'all' ? displayOrders : displayOrders.filter((o) => {
    const liveStatus = orderFlow[o.id] ?? o.status
    return liveStatus === filter
  })

  const filters: FilterKey[] = ['all', 'draft', 'calc', 'ready', 'released']

  const startCalc = (id: string) => {
    setOrderFlow((prev) => ({ ...prev, [id]: 'calc' }))
    setTimeout(() => setOrderFlow((prev) => ({ ...prev, [id]: 'ready' })), 2500)
  }

  const releaseOrder = (id: string) => {
    setOrderFlow((prev) => ({ ...prev, [id]: 'released' }))
  }

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 h-7 rounded-md text-[12px] inline-flex items-center gap-1.5 font-medium transition ${
                filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f === 'all' ? t.common.all : t.status[f]}
              <span className={`text-[10px] tabular-nums ${filter === f ? 'text-white/60' : 'text-stone-400'}`}>
                {counts[f] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <GhostBtn icon="filter">{t.common.filter}</GhostBtn>
        <PrimaryBtn icon="plus" onClick={() => setShowNewOrder(true)}>{t.orders.newOrder}</PrimaryBtn>
      </div>

      <NewOrderDrawer open={showNewOrder} onClose={() => setShowNewOrder(false)} />

      <Card className="overflow-hidden p-0">
        {/* Column headers */}
        <div className="grid grid-cols-[160px_1fr_120px_110px_140px_130px_24px] gap-4 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium border-b border-stone-200/80 bg-stone-50/60">
          <div>{t.orders.cols.id}</div>
          <div>{t.orders.cols.customer}</div>
          <div>{t.orders.cols.type}</div>
          <div>{t.orders.cols.date}</div>
          <div>{t.orders.cols.status}</div>
          <div className="text-right">{t.orders.cols.total}</div>
          <div />
        </div>
        {filtered.map((o) => (
          <OrderRow
            key={o.id}
            order={o}
            t={t}
            liveStatus={(orderFlow[o.id] ?? o.status) as OrderStatus}
            expanded={expandedId === o.id}
            onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
            onCalc={() => startCalc(o.id)}
            onRelease={() => releaseOrder(o.id)}
            realOrderId={o.uuid}
          />
        ))}
      </Card>
    </div>
  )
}

interface OrderRowProps {
  order: Order
  t: typeof I18N.hu
  liveStatus: OrderStatus
  expanded: boolean
  onToggle: () => void
  onCalc: () => void
  onRelease: () => void
  realOrderId: string | null // UUID from API for fetching details
}

function OrderRow({ order, t, liveStatus, expanded, onToggle, onCalc, onRelease, realOrderId }: OrderRowProps) {
  const isCalculating = liveStatus === 'calc'

  // Fetch material requisition and hardware specs when expanded and ready/released
  const shouldFetchDetails = expanded && (liveStatus === 'ready' || liveStatus === 'released')
  const { materials, totalCost, loading: materialsLoading, isMock: materialsMock } = useMaterialReq(shouldFetchDetails ? realOrderId : null)
  const { specs, loading: specsLoading, isMock: specsMock } = useHardwareSpecs(shouldFetchDetails ? realOrderId : null)

  const details = [
    { label: 'Tételszám', value: `${order.items} ${t.common.pieces}` },
    { label: 'Anyag',     value: order.type === 'door' ? 'Tölgy 40mm' : order.type === 'cabinet' ? 'Bükk 18mm + MDF' : 'Egyedi' },
    { label: 'Élzárás',   value: 'ABS 2mm színazonos' },
    { label: 'Felület',   value: order.type === 'door' ? 'Olajos lazúr' : 'Lakkozott' },
  ]

  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[160px_1fr_120px_110px_140px_130px_24px] gap-4 px-5 py-3 items-center hover:bg-stone-50/70 text-left"
      >
        <div className="text-[11.5px] font-mono text-stone-500">{order.id}</div>
        <div className="text-[12.5px] font-medium text-stone-900 truncate">{order.customer}</div>
        <div className="text-[12px] text-stone-600">{t.orders.types[order.type]}</div>
        <div className="text-[11.5px] font-mono text-stone-500">{order.date}</div>
        <div className="inline-flex items-center gap-1.5">
          <StatusPill status={liveStatus} label={t.status[liveStatus]} />
          {isCalculating && (
            <span className="w-3 h-3 rounded-full border-2 border-teal-500 border-t-transparent animate-spin block" />
          )}
        </div>
        <div className="text-[12.5px] font-medium text-stone-900 text-right tabular-nums">
          {order.total > 0 ? fmtHUF(order.total) : '—'}
        </div>
        <div className={`text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <Icon name="chevron" size={14} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-2 bg-stone-50/40 border-t border-stone-100">
          {/* 4-col detail grid */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {details.map((b, i) => (
              <div key={i} className="bg-white border border-stone-200/70 rounded-lg p-3">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500">{b.label}</div>
                <div className="text-[12.5px] text-stone-900 mt-0.5">{b.value}</div>
              </div>
            ))}
          </div>

          {/* Anyaglista + Specifikáció (only for ready/released) */}
          {(liveStatus === 'ready' || liveStatus === 'released') && (
            <div className="space-y-3 mb-3">
              {/* Material Requisition Table - real API data */}
              <MaterialRequisitionTable
                materials={materials}
                loading={materialsLoading}
                totalCost={totalCost}
                isMock={materialsMock}
              />

              {/* Hardware Specs Card - real API data */}
              <HardwareSpecsCard
                specs={specs}
                loading={specsLoading}
                isMock={specsMock}
              />
            </div>
          )}

          {/* Released banner */}
          {liveStatus === 'released' && (
            <div className="mb-3 px-3.5 py-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/60 flex items-center gap-2 text-[11.5px] text-emerald-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Kiadva gyártásba — követhető a <span className="font-medium">Munkafolyamat</span> nézetben.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <GhostBtn icon="external">{t.common.cuttingPlan}</GhostBtn>
            <GhostBtn icon="download">{t.common.pdf}</GhostBtn>
            <div className="flex-1" />
            {liveStatus === 'draft' && (
              <PrimaryBtn icon="check" onClick={onCalc}>Számítás indítása</PrimaryBtn>
            )}
            {isCalculating && (
              <PrimaryBtn>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin block" />
                  Számítás folyamatban…
                </span>
              </PrimaryBtn>
            )}
            {liveStatus === 'ready' && (
              <PrimaryBtn icon="external" onClick={onRelease}>Kiadás gyártásba</PrimaryBtn>
            )}
            {liveStatus === 'released' && (
              <GhostBtn icon="external">Munkafolyamat megnyitása</GhostBtn>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

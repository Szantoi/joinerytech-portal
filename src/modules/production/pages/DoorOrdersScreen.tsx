import { useState } from 'react'
import { QueryGate, StatusPill } from '../../../components/ui'
import { ORDERS_PAGE_SIZE, useOrders } from '../services'
import { DOOR_ORDER_STATUS_META, formatDate } from './labels'
import { OrderDetailSlideOver } from './OrderDetailSlideOver'

/**
 * Ajtórendelések (joinery DoorOrder) — lapozott lista + részlet-SlideOver
 * (FSM-akciók + szabásjegyzék ott élnek). A lapméret a config-vezérelt
 * ORDERS_PAGE_SIZE-ból jön (nincs literál a képernyőn).
 */
export function DoorOrdersScreen() {
  const [page, setPage] = useState(1)
  const orders = useOrders({ page, pageSize: ORDERS_PAGE_SIZE })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = orders.data?.items ?? []
  const totalCount = orders.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ORDERS_PAGE_SIZE))

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Ajtórendelések</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Draft → Submitted → Calculating → Calculated/CalculationFailed (+Revert)
        </p>
      </div>

      <QueryGate isPending={orders.isPending} isError={orders.isError} onRetry={() => void orders.refetch()} resource="ajtórendelések">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-ink-muted">
            Nincs ajtórendelés.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface-1">
              {rows.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelectedId(o.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-ink">{o.projectName}</div>
                      <div className="truncate font-mono text-[10.5px] text-ink-muted">
                        {o.projectId} · {o.itemCount} tétel · {formatDate(o.createdAt)}
                      </div>
                    </div>
                    <StatusPill size="sm" tone={DOOR_ORDER_STATUS_META[o.status].tone} label={DOOR_ORDER_STATUS_META[o.status].label} />
                  </button>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-muted">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md px-2.5 py-1 hover:bg-surface-2 disabled:opacity-40"
                >
                  ← Előző
                </button>
                <span>{page} / {totalPages} oldal · {totalCount} rendelés</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md px-2.5 py-1 hover:bg-surface-2 disabled:opacity-40"
                >
                  Következő →
                </button>
              </div>
            )}
          </>
        )}
      </QueryGate>

      <OrderDetailSlideOver orderId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

import { Button, FsmStepper, SlideOver, StatusPill } from '../../../components/ui'
import {
  DOOR_ORDER_FSM, DOOR_ORDER_MAIN_PATH, DOOR_ORDER_PORTAL_ACTIONS,
  isDoorOrderStatusUnreachable, submitItemsBlockReason,
  useCalculateOrder, useOrder, useOrderCuttingList, useOrderTransition,
} from '../services'
import { transitionBlockReason } from '../../../services/fsmGuards'
import type { DoorOrderStatus } from '../services/wire'
import {
  DOOR_ORDER_ACTION_LABELS, DOOR_ORDER_STATUS_META, DOOR_ORDER_UNREACHABLE_HINT,
  formatDate,
} from './labels'

/**
 * Ajtórendelés-részlet — FSM-stepper a fő láncon (Draft→Submitted→Calculating→
 * Calculated), a submit/revert akciók `disabledReason`-nel (közös fsm.ts +
 * submitItemsBlockReason), kalkuláció-indítás és a szabásjegyzék (ha van).
 *
 * ⚠ Gap-jelölés (doksi P6 + task-elv 3.): az `InProduction`/`Completed`/
 * `Cancelled` állapotok a backendben ELÉRHETETLENEK (nincs átmenet) — a UI
 * ezeket a fő lánc UTÁN, letiltott, tooltippel magyarázott szakaszként
 * mutatja, NEM hazudja aktívnak.
 */
export function OrderDetailSlideOver({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const order = useOrder(orderId)
  const transition = useOrderTransition()
  const calculate = useCalculateOrder()
  const cuttingList = useOrderCuttingList(orderId, order.data?.status === 'Calculated')

  if (orderId === null) return null
  const data = order.data

  // Minden lehetséges státusz címkéje (nem csak a fő láncé) — a submit/revert
  // guard from-halmaza (Draft/CalculationFailed/Calculated) mellett a JELENLEGI
  // állapot is bármelyik 9 tagnév lehet (pl. ConfirmedFromSales).
  const statusLabels = Object.fromEntries(
    Object.entries(DOOR_ORDER_STATUS_META).map(([key, meta]) => [key, meta.label]),
  ) as Record<DoorOrderStatus, string>

  return (
    <SlideOver open onClose={onClose} title={data?.projectName ?? orderId} subtitle="Ajtórendelés" width={560}>
      {!data ? (
        <p className="text-[12.5px] text-ink-muted">Betöltés…</p>
      ) : (
        <div className="space-y-5">
          <FsmStepper
            steps={DOOR_ORDER_MAIN_PATH.map((key) => ({ key, label: DOOR_ORDER_STATUS_META[key].label }))}
            currentKey={data.status}
            sideLabel={DOOR_ORDER_STATUS_META[data.status]?.label}
            label="Ajtórendelés állapota"
          />

          {/* Gap-szakasz: backend-elérhetetlen állapotok — disabled + tooltip, NEM hazudott akció.
              (Ha a rendelés valamiért MÁR ilyen állapotban van — pl. külső betöltés —, a
              stepper sideLabel-je jelzi; ez a jelvény a NORMÁL, elérhető úton figyelmeztet.) */}
          {!isDoorOrderStatusUnreachable(data.status) && (
            <div className="flex items-center gap-1.5 opacity-50" title={DOOR_ORDER_UNREACHABLE_HINT}>
              <span aria-hidden="true" className="text-ink-muted">→</span>
              <span className="rounded-full border border-dashed border-line px-2 py-0.5 text-[10.5px] text-ink-muted">
                Gyártásban / Elkészült (nincs backend-átmenet)
              </span>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <dt className="text-ink-muted">Projekt-azonosító</dt>
              <dd className="font-mono text-ink">{data.projectId}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Tételszám</dt>
              <dd className="text-ink">{data.itemCount}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Létrehozva</dt>
              <dd className="text-ink">{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Állapot</dt>
              <dd><StatusPill size="sm" tone={DOOR_ORDER_STATUS_META[data.status].tone} label={DOOR_ORDER_STATUS_META[data.status].label} /></dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {DOOR_ORDER_PORTAL_ACTIONS.map((action) => {
              const fsmReason = transitionBlockReason(DOOR_ORDER_FSM, action, data.status, statusLabels)
              const reason = action === 'submit' && !fsmReason ? submitItemsBlockReason(data.itemCount) : fsmReason
              return (
                <Button
                  key={action}
                  size="sm"
                  disabledReason={reason}
                  onClick={() => transition.mutate({ id: data.id, action })}
                >
                  {DOOR_ORDER_ACTION_LABELS[action]}
                </Button>
              )
            })}
            <Button
              size="sm" variant="secondary"
              disabledReason={data.status === 'Draft' || data.status === 'Submitted' ? undefined : 'Kalkuláció csak beadott rendelésre futtatható.'}
              onClick={() => calculate.mutate(data.id)}
            >
              Kalkuláció indítása
            </Button>
          </div>

          {data.status === 'Calculated' && (
            <div>
              <h3 className="mb-2 text-[12.5px] font-semibold text-ink">Szabásjegyzék</h3>
              {cuttingList.isPending ? (
                <p className="text-[12px] text-ink-muted">Betöltés…</p>
              ) : cuttingList.isError || !cuttingList.data ? (
                <p className="text-[12px] text-ink-muted">A szabásjegyzék nem érhető el.</p>
              ) : (
                <ul className="space-y-1">
                  {cuttingList.data.items.map((item, i) => (
                    <li key={`${item.itemSorszam}-${i}`} className="rounded-lg border border-line px-3 py-2 text-[11.5px]">
                      <span className="font-mono text-ink-muted">{item.itemSorszam}</span>{' '}
                      <span className="text-ink">{item.componentName}</span>{' '}
                      <span className="text-ink-muted">— {item.material}, {item.width}×{item.length}×{item.thickness} mm × {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </SlideOver>
  )
}

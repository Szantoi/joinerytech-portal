import { useState, useEffect } from 'react'
import { SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  PO_FSM_STEPS, PO_STATUS_STYLE, getMockPODetail,
  type PODetailDto, type POLineDto,
} from '../../data/data-procurement'

interface Props {
  open: boolean
  orderId: string
  onClose: () => void
}

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

export function PODetailSlideOver({ open, orderId, onClose }: Props) {
  const { data, refetch } = useApi<PODetailDto>(
    orderId ? `${API_BASE.procurement}/api/orders/${orderId}` : null
  )
  useEffect(() => { if (open && orderId) refetch() }, [open, orderId]) // eslint-disable-line

  const order: PODetailDto = data ?? getMockPODetail(orderId)
  const tone = PO_STATUS_STYLE[order.status] ?? PO_STATUS_STYLE.Submitted

  const currentStep = PO_FSM_STEPS.findIndex((s) => s.key === order.status)
  const canRecord = order.status !== 'Delivered' && order.status !== 'Cancelled'

  // Delivery form state (inline drawer)
  const [showDelivery, setShowDelivery] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [lineQtys, setLineQtys] = useState<Record<string, number>>({})
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryDone, setDeliveryDone] = useState(false)

  useEffect(() => {
    if (showDelivery) {
      const init: Record<string, number> = {}
      order.lines.forEach((l) => { init[l.id] = l.quantity })
      setLineQtys(init)
      setDeliveryDate('')
      setDeliveryNote('')
      setDeliveryDone(false)
    }
  }, [showDelivery]) // eslint-disable-line

  const { mutate } = useMutation<unknown>()

  async function submitDelivery() {
    if (!deliveryDate) return
    setDeliveryLoading(true)
    try {
      await mutate(`${API_BASE.procurement}/api/deliveries`, {
        method: 'POST',
        body: {
          orderId,
          deliveredAt: deliveryDate,
          note: deliveryNote || undefined,
          lines: order.lines.map((l) => ({
            orderLineId: l.id,
            deliveredQty: lineQtys[l.id] ?? l.quantity,
          })),
        },
      })
      setDeliveryDone(true)
      setShowDelivery(false)
    } catch { /* silent */ } finally {
      setDeliveryLoading(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={orderId}
      subtitle={order.supplierName}
      width={640}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-6">

        {/* Státusz + fejléc */}
        <div className="flex items-start gap-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10.5px] font-medium shrink-0 ${tone.bg} ${tone.fg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            {tone.label}
          </span>
          <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">Várható érk.</dt><dd className="text-stone-900 font-mono">{order.expectedDelivery}</dd></div>
            {order.confirmedDelivery && (
              <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">Visszaigazolva</dt><dd className="text-stone-900 font-mono">{order.confirmedDelivery}</dd></div>
            )}
            {order.trackingNumber && (
              <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">Nyomkövetés</dt><dd className="text-stone-900 font-mono">{order.trackingNumber}</dd></div>
            )}
          </dl>
        </div>

        {/* FSM timeline */}
        {order.status !== 'Cancelled' && (
          <div>
            <div className={SECTION}>Állapot</div>
            <div className="flex items-center gap-0">
              {PO_FSM_STEPS.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold border-2 ${
                        done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                        active ? 'bg-indigo-600 border-indigo-600 text-white' :
                                 'bg-white border-stone-200 text-stone-400'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className={`text-[9.5px] mt-1 font-medium ${active ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-stone-400'}`}>
                        {step.label}
                      </div>
                    </div>
                    {i < PO_FSM_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tételek */}
        <div>
          <div className={SECTION}>Tételek</div>
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200">
                  <th className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">Anyag</th>
                  <th className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-20">Kód</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-16">Menny.</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-24">Egységár</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-24">Összesen</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line: POLineDto) => (
                  <tr key={line.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-3 py-2 text-stone-900">{line.materialName}</td>
                    <td className="px-3 py-2 text-stone-500 font-mono text-[10.5px]">{line.materialCode ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-stone-700">{line.quantity} {line.unit}</td>
                    <td className="px-3 py-2 text-right text-stone-700 font-mono">{line.unitPrice.toLocaleString('hu-HU')}</td>
                    <td className="px-3 py-2 text-right font-medium text-stone-900 font-mono">{line.lineTotal.toLocaleString('hu-HU')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50/70 border-t border-stone-200">
                  <td colSpan={4} className="px-3 py-2 text-right text-[11px] font-semibold text-stone-700">Nettó összesen</td>
                  <td className="px-3 py-2 text-right font-semibold text-stone-900 font-mono">
                    {order.lines.reduce((s, l) => s + l.lineTotal, 0).toLocaleString('hu-HU')} Ft
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Kapcsolat */}
        {(order.contactName || order.contactEmail) && (
          <div>
            <div className={SECTION}>Kapcsolat</div>
            <dl className="space-y-1 text-[12px]">
              {order.contactName && <div className="flex gap-3"><dt className="text-stone-500 w-24 shrink-0">Kapcsolattartó</dt><dd className="text-stone-900">{order.contactName}</dd></div>}
              {order.contactEmail && <div className="flex gap-3"><dt className="text-stone-500 w-24 shrink-0">E-mail</dt><dd className="text-stone-700 font-mono">{order.contactEmail}</dd></div>}
              {order.contactPhone && <div className="flex gap-3"><dt className="text-stone-500 w-24 shrink-0">Telefon</dt><dd className="text-stone-700 font-mono">{order.contactPhone}</dd></div>}
            </dl>
          </div>
        )}

        {/* Megjegyzés */}
        {order.note && (
          <div>
            <div className={SECTION}>Megjegyzés</div>
            <p className="text-[12px] text-stone-700">{order.note}</p>
          </div>
        )}

        {/* Szállítás rögzítése */}
        {canRecord && !showDelivery && (
          <div>
            <button
              onClick={() => setShowDelivery(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700"
            >
              📦 Szállítás rögzítése
            </button>
          </div>
        )}

        {deliveryDone && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-800">
            ✓ Szállítás sikeresen rögzítve
          </div>
        )}

        {/* Szállítás rögzítő drawer (inline) */}
        {showDelivery && (
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-4">
            <div className="text-[12.5px] font-semibold text-stone-900">Szállítás rögzítése</div>

            {/* Per-tétel stepper */}
            <div className="space-y-2">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1">Beérkezett mennyiségek</div>
              {order.lines.map((line: POLineDto) => {
                const qty = lineQtys[line.id] ?? line.quantity
                const diff = qty - line.quantity
                return (
                  <div key={line.id} className="flex items-center gap-3">
                    <div className="flex-1 text-[11.5px] text-stone-700 min-w-0 truncate">{line.materialName}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setLineQtys((p) => ({ ...p, [line.id]: Math.max(0, qty - 1) }))}
                        className="w-6 h-6 rounded border border-stone-200 text-stone-700 hover:bg-stone-100 text-[13px] grid place-items-center"
                      >−</button>
                      <span className="w-10 text-center text-[12px] font-mono tabular-nums">{qty}</span>
                      <button
                        onClick={() => setLineQtys((p) => ({ ...p, [line.id]: qty + 1 }))}
                        className="w-6 h-6 rounded border border-stone-200 text-stone-700 hover:bg-stone-100 text-[13px] grid place-items-center"
                      >+</button>
                      <span className="text-[10.5px] text-stone-500 ml-1 w-12">{line.unit}</span>
                    </div>
                    {diff !== 0 && (
                      <span className={`text-[10.5px] font-medium w-14 text-right ${diff > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {diff > 0 ? `+${diff}` : diff} elt.
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Dátum + megjegyzés */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
                  Szállítás dátuma *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  max={today}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
              <div>
                <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
                  Megjegyzés
                </label>
                <input
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  placeholder="Opcionális"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submitDelivery}
                disabled={!deliveryDate || deliveryLoading}
                className="h-8 px-4 bg-indigo-600 text-white text-[11.5px] font-medium rounded-lg disabled:opacity-50 hover:bg-indigo-700"
              >
                {deliveryLoading ? 'Mentés...' : 'Szállítás megerősítése'}
              </button>
              <button
                onClick={() => setShowDelivery(false)}
                className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-100"
              >
                Mégse
              </button>
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  )
}

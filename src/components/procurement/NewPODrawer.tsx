import { useState, useEffect } from 'react'
import { SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import { SUPPLIERS_FALLBACK } from '../../data/data-procurement'

interface SupplierOption { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (orderId: string) => void
}

interface ApiOrderResult { id: string }

const UNITS = ['lap', 'db', 'fm', 'm²', 'kg', 'csomag']

export function NewPODrawer({ open, onClose, onCreated }: Props) {
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [material, setMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('db')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState({
    supplier: false, material: false, quantity: false, expectedDelivery: false,
  })
  const [apiError, setApiError] = useState('')

  const { data: suppliersData, refetch: fetchSuppliers } = useApi<Array<{ id: string; name: string }>>(
    `${API_BASE.procurement}/api/suppliers`
  )
  useEffect(() => { if (open) fetchSuppliers() }, [open]) // eslint-disable-line

  const suppliers: SupplierOption[] = suppliersData ?? SUPPLIERS_FALLBACK

  const { mutate, isLoading: isSaving } = useMutation<ApiOrderResult>()

  const tomorrow = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  })()

  function reset() {
    setSupplierId(''); setSupplierName(''); setMaterial('')
    setQuantity(''); setUnit('db'); setExpectedDelivery(''); setNote('')
    setTouched({ supplier: false, material: false, quantity: false, expectedDelivery: false })
    setApiError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ supplier: true, material: true, quantity: true, expectedDelivery: true })
    if (!supplierId || !material || !quantity || Number(quantity) <= 0 || !expectedDelivery) return
    setApiError('')
    try {
      const result = await mutate(`${API_BASE.procurement}/api/orders`, {
        method: 'POST',
        body: {
          supplierId,
          material,
          quantity: Number(quantity),
          unit,
          expectedDelivery,
          note: note || undefined,
        },
      })
      reset()
      onCreated(result.id)
    } catch {
      setApiError('Hiba történt a megrendelés létrehozásakor')
    }
  }

  const err = {
    supplier: touched.supplier && !supplierId,
    material: touched.material && !material,
    quantity: touched.quantity && (!quantity || Number(quantity) <= 0),
    expectedDelivery: touched.expectedDelivery && (!expectedDelivery || expectedDelivery < tomorrow),
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új megrendelés"
      subtitle="Nyersanyag vagy anyag rendelése szállítótól"
      width={480}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button
            form="new-po-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Létrehozás...' : 'Megrendelés →'}
          </button>
        </>
      }
    >
      <form id="new-po-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

        {/* Szállító */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Szállító *
          </label>
          <select
            value={supplierId}
            onChange={(e) => {
              const opt = suppliers.find((s) => s.id === e.target.value)
              setSupplierId(e.target.value)
              setSupplierName(opt?.name ?? '')
            }}
            onBlur={() => setTouched((p) => ({ ...p, supplier: true }))}
            className={`w-full h-9 px-3 rounded-lg border text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
              err.supplier ? 'border-red-400' : 'border-stone-200'
            }`}
          >
            <option value="">Válasszon szállítót…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {err.supplier && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
          {supplierId && supplierName && (
            <p className="text-[10.5px] text-indigo-600 mt-0.5">{supplierName}</p>
          )}
        </div>

        {/* Anyag */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Anyag / termék *
          </label>
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, material: true }))}
            placeholder="pl. Tölgy bútorlap 22mm"
            className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
              err.material ? 'border-red-400' : 'border-stone-200'
            }`}
          />
          {err.material && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
        </div>

        {/* Mennyiség + egység */}
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Mennyiség *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, quantity: true }))}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
                err.quantity ? 'border-red-400' : 'border-stone-200'
              }`}
            />
            {err.quantity && <p className="text-[11px] text-red-500 mt-0.5">Pozitív szám</p>}
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Egység
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Határidő */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Szállítási határidő *
          </label>
          <input
            type="date"
            value={expectedDelivery}
            min={tomorrow}
            onChange={(e) => setExpectedDelivery(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, expectedDelivery: true }))}
            className={`h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
              err.expectedDelivery ? 'border-red-400' : 'border-stone-200'
            }`}
          />
          {err.expectedDelivery && (
            <p className="text-[11px] text-red-500 mt-0.5">
              {!expectedDelivery ? 'Kötelező mező' : 'Legalább holnap kell legyen'}
            </p>
          )}
        </div>

        {/* Megjegyzés */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Megjegyzés
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="Belső megjegyzés (opcionális)"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
          />
          <div className="text-[10.5px] text-stone-400 text-right">{note.length}/400</div>
        </div>
      </form>
    </SlideOver>
  )
}

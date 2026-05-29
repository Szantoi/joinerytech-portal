import { useState, useEffect } from 'react'
import { Card, Icon, SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  PL_STATUS_STYLE, PRICELISTS_FALLBACK, SUPPLIERS_FALLBACK, getMockPriceListDetail,
  type PriceListDto, type PriceListEntryDto, type PriceListStatus,
} from '../../data/data-procurement-v2'

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

// ─── PriceListPanel ───────────────────────────────────────────────────────────

interface PagedResult<T> { items: T[]; totalCount: number }

export function PriceListPanel() {
  const { data, refetch } = useApi<PagedResult<PriceListDto> | PriceListDto[]>(
    `${API_BASE.procurement}/api/v2/pricelists`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line

  const items: PriceListDto[] = Array.isArray(data) ? data :
    (data as PagedResult<PriceListDto> | null)?.items ?? PRICELISTS_FALLBACK

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  // Collect all entries to compute best-price per materialCode
  const bestPrices: Record<string, number> = {}
  items
    .filter((pl) => pl.status === 'Active')
    .forEach((pl) =>
      pl.entries.forEach((e) => {
        if (bestPrices[e.materialCode] === undefined || e.unitPrice < bestPrices[e.materialCode]) {
          bestPrices[e.materialCode] = e.unitPrice
        }
      })
    )

  // Group active items first
  const sorted = [...items].sort((a, b) => {
    const order: Record<PriceListStatus, number> = { Active: 0, Draft: 1, Expired: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">Árlisták</div>
          <div className="text-[11px] text-stone-500">{items.filter(p => p.status === 'Active').length} aktív árlista</div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11.5px] font-medium hover:bg-indigo-700"
        >
          <Icon name="plus" size={12} />Új árlista
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((pl) => {
          const tone = PL_STATUS_STYLE[pl.status]
          return (
            <Card key={pl.id} className="p-0 overflow-hidden">
              <div
                className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 cursor-pointer hover:bg-stone-50/60"
                onClick={() => setSelectedId(pl.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-stone-900">{pl.supplierName}</div>
                  <div className="text-[10.5px] text-stone-500 font-mono">{pl.listNumber} · {pl.validFrom}{pl.validTo ? ` – ${pl.validTo}` : ''}</div>
                </div>
                <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
                  {tone.label}
                </span>
                <span className="text-[11px] text-stone-400">{pl.entries.length} tétel →</span>
              </div>
              {pl.entries.length > 0 && (
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="px-4 py-1.5 text-left text-[10px] text-stone-400 uppercase tracking-wide">Anyagkód</th>
                      <th className="px-4 py-1.5 text-left text-[10px] text-stone-400 uppercase tracking-wide">Anyag</th>
                      <th className="px-4 py-1.5 text-right text-[10px] text-stone-400 uppercase tracking-wide">Egységár</th>
                      <th className="px-4 py-1.5 text-left text-[10px] text-stone-400 uppercase tracking-wide">Deviza</th>
                      <th className="px-4 py-1.5 text-left text-[10px] text-stone-400 uppercase tracking-wide">Legjobb ár</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.entries.map((e: PriceListEntryDto) => {
                      const isBest = bestPrices[e.materialCode] === e.unitPrice
                      return (
                        <tr key={e.id} className="border-b border-stone-50 last:border-0">
                          <td className="px-4 py-1.5 font-mono text-stone-500 text-[10.5px]">{e.materialCode}</td>
                          <td className="px-4 py-1.5 text-stone-800">{e.materialName}</td>
                          <td className={`px-4 py-1.5 text-right font-mono font-semibold ${isBest ? 'text-emerald-700' : 'text-stone-800'}`}>
                            {e.unitPrice.toLocaleString('hu-HU')}
                          </td>
                          <td className="px-4 py-1.5 text-stone-500">{e.currency}</td>
                          <td className="px-4 py-1.5">
                            {isBest && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                ★ Legjobb
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {pl.entries.length === 0 && (
                <div className="px-4 py-3 text-[11.5px] text-stone-400">Még nincsenek tételek</div>
              )}
            </Card>
          )
        })}
      </div>

      <PriceListDetailSlideOver
        open={!!selectedId}
        listId={selectedId ?? ''}
        allItems={items}
        onClose={() => setSelectedId(null)}
        onRefetch={refetch}
      />
      <NewPriceListDrawer
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); refetch() }}
      />
    </div>
  )
}

// ─── PriceListDetailSlideOver ─────────────────────────────────────────────────

interface DetailProps {
  open: boolean; listId: string
  allItems: PriceListDto[]
  onClose: () => void; onRefetch: () => void
}

function PriceListDetailSlideOver({ open, listId, allItems, onClose, onRefetch }: DetailProps) {
  const { data, refetch } = useApi<PriceListDto>(
    listId ? `${API_BASE.procurement}/api/v2/pricelists/${listId}` : null
  )
  useEffect(() => { if (open && listId) refetch() }, [open, listId]) // eslint-disable-line

  const pl: PriceListDto = data ?? getMockPriceListDetail(listId)
  const tone = PL_STATUS_STYLE[pl.status]

  const [localStatus, setLocalStatus] = useState<PriceListStatus>(pl.status)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionDone, setActionDone] = useState('')
  useEffect(() => { setLocalStatus(pl.status) }, [pl.status])

  const { mutate } = useMutation<unknown>()

  async function activate() {
    setActionLoading(true)
    try {
      await mutate(`${API_BASE.procurement}/api/v2/pricelists/${listId}/activate`, { method: 'POST', body: undefined })
      setLocalStatus('Active')
      setActionDone('Árlista aktiválva')
      onRefetch()
    } catch { /* silent */ } finally {
      setActionLoading(false)
    }
  }

  const localTone = PL_STATUS_STYLE[localStatus]

  // Best prices across all active lists
  const bestPrices: Record<string, number> = {}
  allItems.filter((p) => p.status === 'Active').forEach((p) =>
    p.entries.forEach((e) => {
      if (bestPrices[e.materialCode] === undefined || e.unitPrice < bestPrices[e.materialCode]) {
        bestPrices[e.materialCode] = e.unitPrice
      }
    })
  )

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={pl.listNumber}
      subtitle={pl.supplierName}
      width={600}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-medium ${localTone.bg} ${localTone.fg}`}>
            {localTone.label}
          </span>
          <span className="text-[12px] text-stone-600 font-mono">{pl.validFrom}{pl.validTo ? ` – ${pl.validTo}` : ' – folyamatos'}</span>
        </div>

        {/* Tételek */}
        <div>
          <div className={SECTION}>Tételek ({pl.entries.length})</div>
          {pl.entries.length === 0 ? (
            <div className="text-[12px] text-stone-400">Még nincsenek tételek</div>
          ) : (
            <div className="rounded-lg border border-stone-200 overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-200">
                    {['Anyagkód', 'Anyag', 'Egységár', 'Deviza', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pl.entries.map((e) => {
                    const isBest = bestPrices[e.materialCode] === e.unitPrice
                    return (
                      <tr key={e.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-3 py-2 font-mono text-stone-500 text-[10.5px]">{e.materialCode}</td>
                        <td className="px-3 py-2 text-stone-900">{e.materialName}</td>
                        <td className={`px-3 py-2 font-mono font-semibold ${isBest ? 'text-emerald-700' : 'text-stone-800'}`}>
                          {e.unitPrice.toLocaleString('hu-HU')} {e.currency}
                        </td>
                        <td className="px-3 py-2 text-stone-500">{e.currency}</td>
                        <td className="px-3 py-2">
                          {isBest && (
                            <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              ★ Legjobb ár
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FSM akció */}
        {localStatus === 'Draft' && (
          <div>
            <div className={SECTION}>Akciók</div>
            <button
              onClick={activate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {actionLoading ? 'Aktiválás...' : '✓ Árlista aktiválása'}
            </button>
          </div>
        )}

        {actionDone && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-800">
            ✓ {actionDone}
          </div>
        )}

        {/* void tone suppression */}
        {void tone}
      </div>
    </SlideOver>
  )
}

// ─── NewPriceListDrawer ───────────────────────────────────────────────────────

interface NewPLProps { open: boolean; onClose: () => void; onCreated: () => void }

interface DraftEntry { id: string; materialCode: string; materialName: string; unitPrice: string; currency: string }

function NewPriceListDrawer({ open, onClose, onCreated }: NewPLProps) {
  const { data: suppliersData, refetch: fetchSuppliers } = useApi<Array<{ id: string; name: string }>>(
    `${API_BASE.procurement}/api/suppliers`
  )
  useEffect(() => { if (open) fetchSuppliers() }, [open]) // eslint-disable-line

  const suppliers = suppliersData ?? SUPPLIERS_FALLBACK

  const [supplierId, setSupplierId] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [entries, setEntries] = useState<DraftEntry[]>([
    { id: '1', materialCode: '', materialName: '', unitPrice: '', currency: 'HUF' },
  ])
  const [touched, setTouched] = useState(false)
  const [apiError, setApiError] = useState('')

  const { mutate, isLoading: isSaving } = useMutation<{ id: string }>()

  function reset() {
    setSupplierId(''); setValidFrom(''); setValidTo('')
    setEntries([{ id: '1', materialCode: '', materialName: '', unitPrice: '', currency: 'HUF' }])
    setTouched(false); setApiError('')
  }

  function handleClose() { reset(); onClose() }

  function addEntry() {
    setEntries((p) => [...p, { id: Date.now().toString(), materialCode: '', materialName: '', unitPrice: '', currency: 'HUF' }])
  }
  function removeEntry(id: string) {
    setEntries((p) => p.filter((e) => e.id !== id))
  }
  function updateEntry(id: string, field: keyof DraftEntry, val: string) {
    setEntries((p) => p.map((e) => e.id === id ? { ...e, [field]: val } : e))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched(true)
    if (!supplierId || !validFrom) return
    setApiError('')
    try {
      const result = await mutate(`${API_BASE.procurement}/api/v2/pricelists`, {
        method: 'POST',
        body: { supplierId, validFrom, validTo: validTo || undefined },
      })
      // Add entries in bulk
      if (entries.some((e) => e.materialCode && e.unitPrice)) {
        await mutate(`${API_BASE.procurement}/api/v2/pricelists/${result.id}/entries`, {
          method: 'POST',
          body: entries
            .filter((e) => e.materialCode && e.unitPrice)
            .map((e) => ({
              materialCode: e.materialCode,
              materialName: e.materialName || e.materialCode,
              unitPrice: Number(e.unitPrice),
              currency: e.currency,
            })),
        })
      }
      reset(); onCreated()
    } catch { setApiError('Hiba történt a létrehozáskor') }
  }

  const err = touched && (!supplierId || !validFrom)

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új árlista"
      subtitle="Szállítói árlista rögzítése"
      width={540}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button form="new-pl-form" type="submit" disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60">
            {isSaving ? 'Létrehozás...' : 'Árlista létrehozása →'}
          </button>
        </>
      }
    >
      <form id="new-pl-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Szállító *</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            className={`w-full h-9 px-3 rounded-lg border text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err && !supplierId ? 'border-red-400' : 'border-stone-200'}`}>
            <option value="">Válasszon szállítót…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {err && !supplierId && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Érvényesség kezdete *</label>
            <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err && !validFrom ? 'border-red-400' : 'border-stone-200'}`}
            />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Érvényesség vége</label>
            <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)}
              min={validFrom}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
        </div>

        {/* Tételek */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tételek</div>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[90px_1fr_90px_60px_28px] gap-2 items-center">
                <input value={e.materialCode} onChange={(ev) => updateEntry(e.id, 'materialCode', ev.target.value)}
                  placeholder="Kód" className="h-8 px-2 rounded border border-stone-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300 font-mono" />
                <input value={e.materialName} onChange={(ev) => updateEntry(e.id, 'materialName', ev.target.value)}
                  placeholder={`Anyag ${i + 1}`} className="h-8 px-2 rounded border border-stone-200 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                <input type="number" value={e.unitPrice} onChange={(ev) => updateEntry(e.id, 'unitPrice', ev.target.value)}
                  placeholder="Ár" className="h-8 px-2 rounded border border-stone-200 text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                <select value={e.currency} onChange={(ev) => updateEntry(e.id, 'currency', ev.target.value)}
                  className="h-8 px-1 rounded border border-stone-200 text-[11px] bg-white focus:outline-none">
                  {(['HUF', 'EUR', 'USD'] as const).map((c) => <option key={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => removeEntry(e.id)} disabled={entries.length === 1}
                  className="w-6 h-6 grid place-items-center text-stone-300 hover:text-red-500 disabled:opacity-30">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addEntry}
            className="mt-2 text-[11.5px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
            <Icon name="plus" size={11} />Tétel hozzáadása
          </button>
        </div>
      </form>
    </SlideOver>
  )
}

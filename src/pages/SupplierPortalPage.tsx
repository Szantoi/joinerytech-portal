import { useState, useEffect } from 'react'
import { Card, Icon, SlideOver, GhostBtn } from '../components/ui'
import { useApi, useMutation, API_BASE } from '../hooks/useApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceListStatus = 'Draft' | 'Active' | 'Expired'

interface PriceListDto {
  id: string
  listNumber: string
  supplierId: string
  supplierName: string
  validFrom: string
  validTo: string | null
  status: PriceListStatus
  entries: PriceListEntryDto[]
}

interface PriceListEntryDto {
  id: string
  materialCode: string
  materialName: string
  unitPrice: number
  currency: string
}

interface DraftEntry {
  id: string
  materialCode: string
  materialName: string
  unitPrice: string
  currency: string
}

type SubcontractStatus = 'Pending' | 'Accepted' | 'Rejected' | 'InProgress' | 'Completed' | 'Cancelled'

interface SubcontractOrderDto {
  id: string
  tenantId: string
  supplierId: string
  orderNumber: string
  status: SubcontractStatus
  workDescription: string
  estimatedCost: number
  currency: string
  deadline: string
  rejectionReason: string | null
  acceptedAt: string | null
  completedAt: string | null
  createdBy: string
  createdAt: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PL_STATUS_STYLE: Record<PriceListStatus, { bg: string; fg: string; label: string }> = {
  Active:  { bg: 'bg-emerald-50',  fg: 'text-emerald-700', label: 'Aktív' },
  Draft:   { bg: 'bg-stone-100',   fg: 'text-stone-600',   label: 'Piszkozat' },
  Expired: { bg: 'bg-stone-50',    fg: 'text-stone-400',   label: 'Lejárt' },
}

const SC_STATUS_STYLE: Record<SubcontractStatus, { bg: string; fg: string; label: string }> = {
  Pending:    { bg: 'bg-amber-50',   fg: 'text-amber-700',   label: 'Elfogadásra vár' },
  Accepted:   { bg: 'bg-emerald-50', fg: 'text-emerald-700', label: 'Elfogadva' },
  Rejected:   { bg: 'bg-red-50',     fg: 'text-red-700',     label: 'Elutasítva' },
  InProgress: { bg: 'bg-blue-50',    fg: 'text-blue-700',    label: 'Folyamatban' },
  Completed:  { bg: 'bg-stone-100',  fg: 'text-stone-600',   label: 'Befejezve' },
  Cancelled:  { bg: 'bg-stone-50',   fg: 'text-stone-400',   label: 'Töröl' },
}

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

// ─── SupplierPortalPage ───────────────────────────────────────────────────────

export function SupplierPortalPage() {
  // TODO: Get actual supplier ID from auth context
  const supplierId = 'supplier-1' // Mock for now

  const [activeTab, setActiveTab] = useState<'pricelists' | 'subcontracts'>('pricelists')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-stone-900">Beszállítói Portál</h1>
          <p className="text-sm text-stone-600 mt-1">Árlisták és bérmunka megrendelések kezelése</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('pricelists')}
              className={`
                py-3 px-1 border-b-2 text-sm font-medium
                ${activeTab === 'pricelists'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }
              `}
            >
              Árlistáim
            </button>
            <button
              onClick={() => setActiveTab('subcontracts')}
              className={`
                py-3 px-1 border-b-2 text-sm font-medium
                ${activeTab === 'subcontracts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }
              `}
            >
              Bérmunkáim
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pricelists' && <SupplierPriceListsTab supplierId={supplierId} />}
        {activeTab === 'subcontracts' && <SubcontractOrdersTab supplierId={supplierId} />}
      </div>
    </div>
  )
}

// ─── SupplierPriceListsTab ────────────────────────────────────────────────────

interface SupplierPriceListsTabProps {
  supplierId: string
}

function SupplierPriceListsTab({ supplierId }: SupplierPriceListsTabProps) {
  const { data, refetch } = useApi<PriceListDto[]>(
    `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line

  const items: PriceListDto[] = data ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Group by status: Active first, then Draft, then Expired
  const sorted = [...items].sort((a, b) => {
    const order: Record<PriceListStatus, number> = { Active: 0, Draft: 1, Expired: 2 }
    return order[a.status] - order[b.status]
  })

  const activeCount = items.filter(p => p.status === 'Active').length
  const draftCount = items.filter(p => p.status === 'Draft').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-stone-900">Árlistáim</div>
          <div className="text-sm text-stone-500 mt-1">
            {activeCount} aktív · {draftCount} piszkozat · {items.length} összesen
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Icon name="plus" size={14} />
          Új árlista
        </button>
      </div>

      {/* Price Lists */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-stone-400 text-sm">Még nincsenek árlisták</div>
            <button
              onClick={() => setShowNew(true)}
              className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700"
            >
              Hozz létre egyet →
            </button>
          </Card>
        )}

        {sorted.map((pl) => {
          const tone = PL_STATUS_STYLE[pl.status]
          const isExpired = pl.status === 'Expired'

          return (
            <Card key={pl.id} className={`p-0 overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4 px-4 py-3 border-b border-stone-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-stone-900">{pl.listNumber}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
                      {tone.label}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-1">
                    {pl.validFrom}{pl.validTo ? ` – ${pl.validTo}` : ' – folyamatos'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">{pl.entries.length} tétel</span>
                  {pl.status === 'Draft' && (
                    <button
                      onClick={() => setEditId(pl.id)}
                      className="h-8 px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Szerkesztés
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedId(pl.id)}
                    className="h-8 px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Részletek →
                  </button>
                </div>
              </div>

              {/* Entry preview */}
              {pl.entries.length > 0 && pl.entries.length <= 5 && (
                <div className="px-4 py-2 bg-stone-50/50">
                  <div className="space-y-1">
                    {pl.entries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs">
                        <span className="text-stone-600">
                          <span className="font-mono text-stone-400">{e.materialCode}</span> – {e.materialName}
                        </span>
                        <span className="font-mono font-semibold text-stone-800">
                          {e.unitPrice.toLocaleString('hu-HU')} {e.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      <PriceListDetailSlideOver
        open={!!selectedId}
        listId={selectedId ?? ''}
        supplierId={supplierId}
        allItems={items}
        onClose={() => setSelectedId(null)}
        onRefetch={refetch}
      />

      <EditPriceListDrawer
        open={!!editId}
        listId={editId ?? ''}
        supplierId={supplierId}
        onClose={() => setEditId(null)}
        onSaved={() => { setEditId(null); refetch() }}
      />

      <NewPriceListDrawer
        open={showNew}
        supplierId={supplierId}
        onClose={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); refetch() }}
      />
    </div>
  )
}

// ─── PriceListDetailSlideOver ─────────────────────────────────────────────────

interface DetailProps {
  open: boolean
  listId: string
  supplierId: string
  allItems: PriceListDto[]
  onClose: () => void
  onRefetch: () => void
}

function PriceListDetailSlideOver({ open, listId, supplierId, allItems, onClose, onRefetch }: DetailProps) {
  const { data, refetch } = useApi<PriceListDto>(
    listId ? `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list/${listId}` : null
  )
  useEffect(() => { if (open && listId) refetch() }, [open, listId]) // eslint-disable-line

  const pl: PriceListDto | null = data ?? allItems.find(p => p.id === listId) ?? null
  if (!pl) return null

  const tone = PL_STATUS_STYLE[pl.status]

  const [localStatus, setLocalStatus] = useState<PriceListStatus>(pl.status)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionDone, setActionDone] = useState('')
  const [showActivateConfirm, setShowActivateConfirm] = useState(false)

  useEffect(() => { setLocalStatus(pl.status) }, [pl.status])

  const { mutate } = useMutation<unknown>()

  async function handleActivate() {
    setActionLoading(true)
    try {
      await mutate(
        `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list/${listId}/activate`,
        { method: 'POST', body: undefined }
      )
      setLocalStatus('Active')
      setActionDone('Árlista sikeresen aktiválva!')
      setShowActivateConfirm(false)
      onRefetch()
    } catch {
      setActionDone('Hiba történt az aktiválás során')
    } finally {
      setActionLoading(false)
    }
  }

  const localTone = PL_STATUS_STYLE[localStatus]

  return (
    <>
      <SlideOver
        open={open}
        onClose={onClose}
        title={pl.listNumber}
        subtitle={`Érvényesség: ${pl.validFrom}${pl.validTo ? ` – ${pl.validTo}` : ' – folyamatos'}`}
        width={600}
        footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
      >
        <div className="px-5 py-4 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${localTone.bg} ${localTone.fg}`}>
              {localTone.label}
            </span>
            {localStatus === 'Active' && (
              <span className="text-xs text-emerald-600">✓ Ez az aktív árlista</span>
            )}
          </div>

          {/* Entries */}
          <div>
            <div className={SECTION}>Tételek ({pl.entries.length})</div>
            {pl.entries.length === 0 ? (
              <div className="text-sm text-stone-400">Még nincsenek tételek</div>
            ) : (
              <div className="rounded-lg border border-stone-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-3 py-2 text-left text-xs text-stone-500 font-medium">Anyagkód</th>
                      <th className="px-3 py-2 text-left text-xs text-stone-500 font-medium">Anyag</th>
                      <th className="px-3 py-2 text-right text-xs text-stone-500 font-medium">Egységár</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.entries.map((e) => (
                      <tr key={e.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-3 py-2 font-mono text-stone-500 text-xs">{e.materialCode}</td>
                        <td className="px-3 py-2 text-stone-900">{e.materialName}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-stone-800">
                          {e.unitPrice.toLocaleString('hu-HU')} {e.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          {localStatus === 'Draft' && (
            <div>
              <div className={SECTION}>Műveletek</div>
              <button
                onClick={() => setShowActivateConfirm(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
              >
                <Icon name="check" size={14} />
                {actionLoading ? 'Aktiválás...' : 'Árlista aktiválása'}
              </button>
            </div>
          )}

          {actionDone && (
            <div className={`p-3 rounded-lg text-sm ${
              actionDone.includes('Hiba')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {actionDone}
            </div>
          )}
        </div>
      </SlideOver>

      {/* Activate Confirmation Dialog */}
      {showActivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Árlista aktiválása</h3>
            <p className="text-sm text-stone-600 mb-4">
              Biztosan aktiválni szeretnéd ezt az árlistát?
              Az előző aktív árlista automatikusan lejárt státuszba kerül.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowActivateConfirm(false)}
                className="h-9 px-4 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Mégse
              </button>
              <button
                onClick={handleActivate}
                disabled={actionLoading}
                className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
              >
                {actionLoading ? 'Aktiválás...' : 'Igen, aktiválom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── EditPriceListDrawer ──────────────────────────────────────────────────────

interface EditProps {
  open: boolean
  listId: string
  supplierId: string
  onClose: () => void
  onSaved: () => void
}

function EditPriceListDrawer({ open, listId, supplierId, onClose, onSaved }: EditProps) {
  const { data, refetch } = useApi<PriceListDto>(
    listId ? `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list/${listId}` : null
  )
  useEffect(() => { if (open && listId) refetch() }, [open, listId]) // eslint-disable-line

  const pl: PriceListDto | null = data ?? null

  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (pl) {
      setValidFrom(pl.validFrom)
      setValidTo(pl.validTo ?? '')
      setEntries(pl.entries.map(e => ({
        id: e.id,
        materialCode: e.materialCode,
        materialName: e.materialName,
        unitPrice: e.unitPrice.toString(),
        currency: e.currency
      })))
    }
  }, [pl])

  const { mutate, isLoading: isSaving } = useMutation<unknown>()

  function addEntry() {
    setEntries((p) => [...p, {
      id: Date.now().toString(),
      materialCode: '',
      materialName: '',
      unitPrice: '',
      currency: 'HUF'
    }])
  }

  function removeEntry(id: string) {
    setEntries((p) => p.filter((e) => e.id !== id))
  }

  function updateEntry(id: string, field: keyof DraftEntry, val: string) {
    setEntries((p) => p.map((e) => e.id === id ? { ...e, [field]: val } : e))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!pl) return
    setApiError('')

    try {
      // Update price list metadata
      await mutate(
        `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list/${listId}`,
        {
          method: 'PUT',
          body: {
            validFrom,
            validTo: validTo || null,
            entries: entries
              .filter(e => e.materialCode && e.unitPrice)
              .map(e => ({
                materialCode: e.materialCode,
                materialName: e.materialName || e.materialCode,
                unitPrice: Number(e.unitPrice),
                currency: e.currency
              }))
          }
        }
      )
      onSaved()
    } catch {
      setApiError('Hiba történt a mentés során')
    }
  }

  if (!pl) return null

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`Szerkesztés: ${pl.listNumber}`}
      subtitle="Piszkozat árlista módosítása"
      width={600}
      footer={
        <>
          {apiError && <span className="text-xs text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={onClose}>Mégse</GhostBtn>
          <button
            form="edit-pl-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Mentés...' : 'Módosítások mentése'}
          </button>
        </>
      }
    >
      <form id="edit-pl-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Validity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Érvényesség kezdete
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Érvényesség vége
            </label>
            <input
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              min={validFrom}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
        </div>

        {/* Entries */}
        <div>
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">
            Tételek
          </div>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[90px_1fr_90px_60px_28px] gap-2 items-center">
                <input
                  value={e.materialCode}
                  onChange={(ev) => updateEntry(e.id, 'materialCode', ev.target.value)}
                  placeholder="Kód"
                  className="h-8 px-2 rounded border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 font-mono"
                />
                <input
                  value={e.materialName}
                  onChange={(ev) => updateEntry(e.id, 'materialName', ev.target.value)}
                  placeholder={`Anyag ${i + 1}`}
                  className="h-8 px-2 rounded border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  value={e.unitPrice}
                  onChange={(ev) => updateEntry(e.id, 'unitPrice', ev.target.value)}
                  placeholder="Ár"
                  className="h-8 px-2 rounded border border-stone-200 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <select
                  value={e.currency}
                  onChange={(ev) => updateEntry(e.id, 'currency', ev.target.value)}
                  className="h-8 px-1 rounded border border-stone-200 text-xs bg-white focus:outline-none"
                >
                  {(['HUF', 'EUR', 'USD'] as const).map((c) => <option key={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeEntry(e.id)}
                  disabled={entries.length === 1}
                  className="w-6 h-6 grid place-items-center text-stone-300 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addEntry}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <Icon name="plus" size={11} />
            Tétel hozzáadása
          </button>
        </div>
      </form>
    </SlideOver>
  )
}

// ─── NewPriceListDrawer ───────────────────────────────────────────────────────

interface NewPLProps {
  open: boolean
  supplierId: string
  onClose: () => void
  onCreated: () => void
}

function NewPriceListDrawer({ open, supplierId, onClose, onCreated }: NewPLProps) {
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [entries, setEntries] = useState<DraftEntry[]>([
    { id: '1', materialCode: '', materialName: '', unitPrice: '', currency: 'HUF' },
  ])
  const [touched, setTouched] = useState(false)
  const [apiError, setApiError] = useState('')

  const { mutate, isLoading: isSaving } = useMutation<{ id: string }>()

  function reset() {
    setValidFrom('')
    setValidTo('')
    setEntries([{ id: '1', materialCode: '', materialName: '', unitPrice: '', currency: 'HUF' }])
    setTouched(false)
    setApiError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function addEntry() {
    setEntries((p) => [...p, {
      id: Date.now().toString(),
      materialCode: '',
      materialName: '',
      unitPrice: '',
      currency: 'HUF'
    }])
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
    if (!validFrom) return
    setApiError('')

    try {
      await mutate(
        `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/price-list`,
        {
          method: 'POST',
          body: {
            validFrom,
            validTo: validTo || null,
            entries: entries
              .filter(e => e.materialCode && e.unitPrice)
              .map(e => ({
                materialCode: e.materialCode,
                materialName: e.materialName || e.materialCode,
                unitPrice: Number(e.unitPrice),
                currency: e.currency
              }))
          }
        }
      )
      reset()
      onCreated()
    } catch {
      setApiError('Hiba történt a létrehozáskor')
    }
  }

  const err = touched && !validFrom

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új árlista"
      subtitle="Új piszkozat árlista létrehozása"
      width={600}
      footer={
        <>
          {apiError && <span className="text-xs text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button
            form="new-pl-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Létrehozás...' : 'Árlista létrehozása'}
          </button>
        </>
      }
    >
      <form id="new-pl-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Validity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Érvényesség kezdete *
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
                err ? 'border-red-400' : 'border-stone-200'
              }`}
            />
            {err && <p className="text-xs text-red-500 mt-0.5">Kötelező mező</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              Érvényesség vége
            </label>
            <input
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              min={validFrom}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
        </div>

        {/* Entries */}
        <div>
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">
            Tételek
          </div>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[90px_1fr_90px_60px_28px] gap-2 items-center">
                <input
                  value={e.materialCode}
                  onChange={(ev) => updateEntry(e.id, 'materialCode', ev.target.value)}
                  placeholder="Kód"
                  className="h-8 px-2 rounded border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 font-mono"
                />
                <input
                  value={e.materialName}
                  onChange={(ev) => updateEntry(e.id, 'materialName', ev.target.value)}
                  placeholder={`Anyag ${i + 1}`}
                  className="h-8 px-2 rounded border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  value={e.unitPrice}
                  onChange={(ev) => updateEntry(e.id, 'unitPrice', ev.target.value)}
                  placeholder="Ár"
                  className="h-8 px-2 rounded border border-stone-200 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <select
                  value={e.currency}
                  onChange={(ev) => updateEntry(e.id, 'currency', ev.target.value)}
                  className="h-8 px-1 rounded border border-stone-200 text-xs bg-white focus:outline-none"
                >
                  {(['HUF', 'EUR', 'USD'] as const).map((c) => <option key={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeEntry(e.id)}
                  disabled={entries.length === 1}
                  className="w-6 h-6 grid place-items-center text-stone-300 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addEntry}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <Icon name="plus" size={11} />
            Tétel hozzáadása
          </button>
        </div>
      </form>
    </SlideOver>
  )
}

// ─── SubcontractOrdersTab ─────────────────────────────────────────────────────

interface SubcontractOrdersTabProps {
  supplierId: string
}

function SubcontractOrdersTab({ supplierId }: SubcontractOrdersTabProps) {
  const { data, refetch } = useApi<SubcontractOrderDto[]>(
    `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/subcontracts`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line

  const items: SubcontractOrderDto[] = data ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)

  // Group by status: Pending first, then Accepted, then rest
  const sorted = [...items].sort((a, b) => {
    const order: Record<SubcontractStatus, number> = {
      Pending: 0,
      Accepted: 1,
      InProgress: 2,
      Completed: 3,
      Rejected: 4,
      Cancelled: 5
    }
    return order[a.status] - order[b.status]
  })

  const pendingCount = items.filter(o => o.status === 'Pending').length
  const acceptedCount = items.filter(o => o.status === 'Accepted').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-stone-900">Bérmunka megrendelések</div>
          <div className="text-sm text-stone-500 mt-1">
            {pendingCount} elfogadásra vár · {acceptedCount} elfogadva · {items.length} összesen
          </div>
        </div>
      </div>

      {/* Subcontract Orders */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-stone-400 text-sm">Még nincsenek bérmunka megrendelések</div>
          </Card>
        )}

        {sorted.map((order) => {
          const tone = SC_STATUS_STYLE[order.status]
          const isPending = order.status === 'Pending'
          const isRejected = order.status === 'Rejected'

          return (
            <Card key={order.id} className={`p-0 overflow-hidden ${isRejected ? 'opacity-60' : ''}`}>
              <div className="px-4 py-3 border-b border-stone-100">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-stone-900 font-mono">{order.orderNumber}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="text-sm text-stone-700 mb-2">{order.workDescription}</div>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" size={12} />
                        Határidő: {new Date(order.deadline).toLocaleDateString('hu-HU')}
                      </span>
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        {order.estimatedCost.toLocaleString('hu-HU')} {order.currency}
                      </span>
                    </div>
                    {order.rejectionReason && (
                      <div className="mt-2 text-xs text-red-600">
                        Elutasítás oka: {order.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => setShowRejectDialog(order.id)}
                          className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Elutasítás
                        </button>
                        <button
                          onClick={() => setShowAcceptConfirm(order.id)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                        >
                          <Icon name="check" size={12} />
                          Elfogadás
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedId(order.id)}
                      className="h-8 px-3 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Részletek →
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Accept Confirmation */}
      {showAcceptConfirm && (
        <AcceptConfirmDialog
          orderId={showAcceptConfirm}
          orderNumber={items.find(o => o.id === showAcceptConfirm)?.orderNumber ?? ''}
          supplierId={supplierId}
          onClose={() => setShowAcceptConfirm(null)}
          onSuccess={() => {
            setShowAcceptConfirm(null)
            refetch()
          }}
        />
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <RejectDialog
          orderId={showRejectDialog}
          orderNumber={items.find(o => o.id === showRejectDialog)?.orderNumber ?? ''}
          supplierId={supplierId}
          onClose={() => setShowRejectDialog(null)}
          onSuccess={() => {
            setShowRejectDialog(null)
            refetch()
          }}
        />
      )}

      {/* Detail SlideOver */}
      {selectedId && (
        <SubcontractDetailSlideOver
          open={!!selectedId}
          orderId={selectedId}
          supplierId={supplierId}
          allItems={items}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

// ─── AcceptConfirmDialog ──────────────────────────────────────────────────────

interface AcceptConfirmProps {
  orderId: string
  orderNumber: string
  supplierId: string
  onClose: () => void
  onSuccess: () => void
}

function AcceptConfirmDialog({ orderId, orderNumber, supplierId, onClose, onSuccess }: AcceptConfirmProps) {
  const { mutate, isLoading } = useMutation<unknown>()
  const [error, setError] = useState('')

  async function handleAccept() {
    setError('')
    try {
      await mutate(
        `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/subcontracts/${orderId}/accept`,
        { method: 'POST', body: undefined }
      )
      onSuccess()
    } catch {
      setError('Hiba történt az elfogadás során')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">Megrendelés elfogadása</h3>
        <p className="text-sm text-stone-600 mb-1">
          Biztosan elfogadod a <span className="font-mono font-semibold">{orderNumber}</span> számú bérmunka megrendelést?
        </p>
        <p className="text-xs text-stone-500 mb-4">
          Az elfogadás után a megrendelés "Elfogadva" státuszba kerül.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Mégse
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {isLoading ? 'Elfogadás...' : 'Igen, elfogadom'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RejectDialog ─────────────────────────────────────────────────────────────

interface RejectDialogProps {
  orderId: string
  orderNumber: string
  supplierId: string
  onClose: () => void
  onSuccess: () => void
}

function RejectDialog({ orderId, orderNumber, supplierId, onClose, onSuccess }: RejectDialogProps) {
  const { mutate, isLoading } = useMutation<unknown>()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  async function handleReject(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched(true)
    if (!reason.trim()) return
    setError('')

    try {
      await mutate(
        `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/subcontracts/${orderId}/reject`,
        { method: 'POST', body: { reason: reason.trim() } }
      )
      onSuccess()
    } catch {
      setError('Hiba történt az elutasítás során')
    }
  }

  const err = touched && !reason.trim()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">Megrendelés elutasítása</h3>
        <p className="text-sm text-stone-600 mb-4">
          <span className="font-mono font-semibold">{orderNumber}</span> elutasításának indoklása:
        </p>
        <form onSubmit={handleReject}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add meg az elutasítás okát..."
            className={`w-full h-24 px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 ${
              err ? 'border-red-400' : 'border-stone-200'
            }`}
          />
          {err && <p className="text-xs text-red-500 mt-1">Az indoklás megadása kötelező</p>}
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {isLoading ? 'Elutasítás...' : 'Elutasítás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── SubcontractDetailSlideOver ───────────────────────────────────────────────

interface SubcontractDetailProps {
  open: boolean
  orderId: string
  supplierId: string
  allItems: SubcontractOrderDto[]
  onClose: () => void
}

function SubcontractDetailSlideOver({ open, orderId, supplierId, allItems, onClose }: SubcontractDetailProps) {
  const { data, refetch } = useApi<SubcontractOrderDto>(
    orderId ? `${API_BASE.procurement}/api/procurement/suppliers/${supplierId}/subcontracts/${orderId}` : null
  )
  useEffect(() => { if (open && orderId) refetch() }, [open, orderId]) // eslint-disable-line

  const order: SubcontractOrderDto | null = data ?? allItems.find(o => o.id === orderId) ?? null
  if (!order) return null

  const tone = SC_STATUS_STYLE[order.status]

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={order.orderNumber}
      subtitle={`Bérmunka megrendelés részletei`}
      width={600}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-5">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
            {tone.label}
          </span>
        </div>

        {/* Description */}
        <div>
          <div className={SECTION}>Munka leírása</div>
          <div className="text-sm text-stone-900 bg-stone-50 p-3 rounded-lg">
            {order.workDescription}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className={SECTION}>Megrendelés adatai</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Becsült költség:</span>
              <span className="font-mono font-semibold text-stone-900">
                {order.estimatedCost.toLocaleString('hu-HU')} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Határidő:</span>
              <span className="font-medium text-stone-900">
                {new Date(order.deadline).toLocaleDateString('hu-HU')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Létrehozva:</span>
              <span className="text-stone-600">
                {new Date(order.createdAt).toLocaleString('hu-HU')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Létrehozta:</span>
              <span className="text-stone-600">{order.createdBy}</span>
            </div>
            {order.acceptedAt && (
              <div className="flex justify-between">
                <span className="text-stone-500">Elfogadva:</span>
                <span className="text-emerald-600">
                  {new Date(order.acceptedAt).toLocaleString('hu-HU')}
                </span>
              </div>
            )}
            {order.completedAt && (
              <div className="flex justify-between">
                <span className="text-stone-500">Befejezve:</span>
                <span className="text-stone-600">
                  {new Date(order.completedAt).toLocaleString('hu-HU')}
                </span>
              </div>
            )}
            {order.rejectionReason && (
              <div className="pt-2 border-t border-stone-200">
                <div className="text-stone-500 mb-1">Elutasítás oka:</div>
                <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  {order.rejectionReason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

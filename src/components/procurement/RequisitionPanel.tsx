import { useState, useEffect } from 'react'
import { Card, Icon, SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  REQ_STATUS_STYLE, REQUISITIONS_FALLBACK, getMockRequisitionDetail,
  type RequisitionDto, type RequisitionStatus,
} from '../../data/data-procurement-v2'

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

// ─── RequisitionPanel ─────────────────────────────────────────────────────────

interface PagedResult<T> { items: T[]; totalCount: number }

export function RequisitionPanel() {
  const { data, refetch } = useApi<PagedResult<RequisitionDto> | RequisitionDto[]>(
    `${API_BASE.procurement}/api/v2/requisitions`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line

  const items: RequisitionDto[] = Array.isArray(data) ? data :
    (data as PagedResult<RequisitionDto> | null)?.items ?? REQUISITIONS_FALLBACK

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">Beszerzési igénylések</div>
          <div className="text-[11px] text-stone-500">{items.length} igénylés</div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11.5px] font-medium hover:bg-indigo-700"
        >
          <Icon name="plus" size={12} />Új igénylés
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-stone-50/70 border-b border-stone-200">
              {['Igénylésszám', 'Anyagkód', 'Anyag', 'Menny.', 'Benyújtó', 'Dátum', 'Státusz'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const tone = REQ_STATUS_STYLE[r.status]
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-mono text-stone-700">{r.reqNumber}</td>
                  <td className="px-4 py-2.5 font-mono text-stone-500 text-[11px]">{r.materialCode}</td>
                  <td className="px-4 py-2.5 text-stone-900 font-medium">{r.materialName}</td>
                  <td className="px-4 py-2.5 text-stone-700 tabular-nums">{r.quantity} {r.unit}</td>
                  <td className="px-4 py-2.5 text-stone-600">{r.submittedBy}</td>
                  <td className="px-4 py-2.5 font-mono text-stone-500">{r.submittedAt}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium ${tone.bg} ${tone.fg}`}>
                      <span className={`w-1 h-1 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <RequisitionDetailSlideOver
        open={!!selectedId}
        reqId={selectedId ?? ''}
        onClose={() => setSelectedId(null)}
        onRefetch={refetch}
      />
      <CreateRequisitionDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); refetch() }}
      />
    </div>
  )
}

// ─── RequisitionDetailSlideOver ───────────────────────────────────────────────

interface DetailProps {
  open: boolean; reqId: string; onClose: () => void; onRefetch: () => void
}

function RequisitionDetailSlideOver({ open, reqId, onClose, onRefetch }: DetailProps) {
  const { data, refetch } = useApi<RequisitionDto>(
    reqId ? `${API_BASE.procurement}/api/v2/requisitions/${reqId}` : null
  )
  useEffect(() => { if (open && reqId) refetch() }, [open, reqId]) // eslint-disable-line

  const req: RequisitionDto = data ?? getMockRequisitionDetail(reqId)
  const tone = REQ_STATUS_STYLE[req.status]

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<RequisitionStatus>(req.status)
  const [actionDone, setActionDone] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  useEffect(() => { setLocalStatus(req.status) }, [req.status])

  const { mutate } = useMutation<unknown>()

  // SoD check — in real app compare req.submittedBy sub with current user sub
  // Mock: flag if requester == 'Kovács P.' (simulate same user)
  const currentUser = 'Kovács P.'
  const isSoDViolation = req.submittedBy === currentUser

  async function doAction(action: 'approve' | 'reject', body?: unknown) {
    setActionLoading(action)
    try {
      await mutate(`${API_BASE.procurement}/api/v2/requisitions/${reqId}/${action}`, {
        method: 'POST', body,
      })
      if (action === 'approve') { setLocalStatus('Approved'); setActionDone('Igénylés jóváhagyva') }
      if (action === 'reject')  { setLocalStatus('Rejected'); setShowRejectForm(false); setActionDone('Igénylés visszautasítva') }
      onRefetch()
    } catch { /* silent */ } finally {
      setActionLoading(null)
    }
  }

  const localTone = REQ_STATUS_STYLE[localStatus]
  const canAct = localStatus === 'Draft'

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={req.reqNumber}
      subtitle={req.materialName}
      width={520}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-5">
        {/* Státusz */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10.5px] font-medium ${localTone.bg} ${localTone.fg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${localTone.dot}`} />
          {localTone.label}
        </span>

        {/* SoD figyelmeztetés */}
        {isSoDViolation && canAct && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-600 text-[14px] shrink-0">⚠️</span>
            <div className="text-[11.5px] text-amber-800">
              <span className="font-semibold">Érdekeltségi összeférhetetlenség:</span> A jóváhagyó megegyezik az igénylővel. Az akciók tiltva.
            </div>
          </div>
        )}

        {/* Adatok */}
        <div>
          <div className={SECTION}>Igénylés adatai</div>
          <dl className="space-y-1.5 text-[12px]">
            {[
              { l: 'Anyagkód',  v: req.materialCode },
              { l: 'Anyag',     v: req.materialName },
              { l: 'Mennyiség', v: `${req.quantity} ${req.unit}` },
              { l: 'Benyújtó',  v: req.submittedBy },
              { l: 'Dátum',     v: req.submittedAt },
              ...(req.preferredSupplierName ? [{ l: 'Preferált szállító', v: req.preferredSupplierName }] : []),
            ].map((row) => (
              <div key={row.l} className="flex gap-3">
                <dt className="text-stone-500 w-36 shrink-0">{row.l}</dt>
                <dd className="text-stone-900">{row.v}</dd>
              </div>
            ))}
          </dl>
          {req.note && (
            <div className="mt-3 p-2.5 bg-stone-50 rounded-lg text-[11.5px] text-stone-700 border border-stone-100">
              {req.note}
            </div>
          )}
        </div>

        {/* FSM akciók */}
        {canAct && !isSoDViolation && (
          <div>
            <div className={SECTION}>Akciók</div>
            {!showRejectForm ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => doAction('approve')}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {actionLoading === 'approve' ? 'Folyamatban...' : '✓ Jóváhagyás'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-[12px] text-red-600 hover:bg-red-50"
                >
                  ✕ Visszautasítás
                </button>
              </div>
            ) : (
              <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 space-y-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Indoklás</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-red-300/40 resize-none"
                    placeholder="Miért utasítja vissza?"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction('reject', { reason: rejectReason })}
                    disabled={!!actionLoading}
                    className="h-8 px-4 bg-red-600 text-white text-[11.5px] rounded-lg hover:bg-red-700 disabled:opacity-60"
                  >
                    {actionLoading === 'reject' ? 'Folyamatban...' : 'Visszautasítás megerősítése'}
                  </button>
                  <button onClick={() => setShowRejectForm(false)}
                    className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-50">
                    Mégse
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {actionDone && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-800">
            ✓ {actionDone}
          </div>
        )}

        {/* void warning suppression */}
        {void tone}
      </div>
    </SlideOver>
  )
}

// ─── CreateRequisitionDrawer ──────────────────────────────────────────────────

interface CreateProps { open: boolean; onClose: () => void; onCreated: () => void }

const UNITS_REQ = ['lap', 'db', 'fm', 'm²', 'kg', 'csomag']

function CreateRequisitionDrawer({ open, onClose, onCreated }: CreateProps) {
  const [materialCode, setMaterialCode] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('db')
  const [supplierName, setSupplierName] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState({ code: false, name: false, qty: false })
  const [apiError, setApiError] = useState('')

  const { mutate, isLoading: isSaving } = useMutation<unknown>()

  function reset() {
    setMaterialCode(''); setMaterialName(''); setQuantity('')
    setUnit('db'); setSupplierName(''); setNote('')
    setTouched({ code: false, name: false, qty: false }); setApiError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ code: true, name: true, qty: true })
    if (!materialCode || !materialName || !quantity || Number(quantity) <= 0) return
    setApiError('')
    try {
      await mutate(`${API_BASE.procurement}/api/v2/requisitions`, {
        method: 'POST',
        body: {
          materialCode, materialName,
          quantity: Number(quantity), unit,
          preferredSupplierName: supplierName || undefined,
          note: note || undefined,
        },
      })
      reset(); onCreated()
    } catch { setApiError('Hiba történt a létrehozáskor') }
  }

  const err = {
    code: touched.code && !materialCode,
    name: touched.name && !materialName,
    qty:  touched.qty && (!quantity || Number(quantity) <= 0),
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új igénylés"
      subtitle="Anyag vagy termék igénylése"
      width={460}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button form="create-req-form" type="submit" disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60">
            {isSaving ? 'Létrehozás...' : 'Igénylés →'}
          </button>
        </>
      }
    >
      <form id="create-req-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Anyagkód *</label>
          <input type="text" value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, code: true }))}
            placeholder="pl. MAT-OAK-22"
            className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err.code ? 'border-red-400' : 'border-stone-200'}`}
          />
          {err.code && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
        </div>
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Anyagnév *</label>
          <input type="text" value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            placeholder="pl. Tölgy bútorlap 22mm"
            className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err.name ? 'border-red-400' : 'border-stone-200'}`}
          />
          {err.name && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
        </div>
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Mennyiség *</label>
            <input type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, qty: true }))}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err.qty ? 'border-red-400' : 'border-stone-200'}`}
            />
            {err.qty && <p className="text-[11px] text-red-500 mt-0.5">Pozitív szám</p>}
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Egység</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
              {UNITS_REQ.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Preferált szállító</label>
          <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Opcionális"
            className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Megjegyzés</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
            placeholder="Belső megjegyzés"
          />
        </div>
      </form>
    </SlideOver>
  )
}

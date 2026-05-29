import { useState, useEffect } from 'react'
import { Card, Icon, SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  INV_STATUS_STYLE, MATCH_STYLE, INVOICES_FALLBACK, getMockInvoiceDetail,
  type InvoiceDto, type InvoiceLineDto, type InvoiceStatus,
} from '../../data/data-procurement-v2'

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'
const INV_VAT_RATE = 0.27

// ─── InvoicePanel ─────────────────────────────────────────────────────────────

interface PagedResult<T> { items: T[]; totalCount: number }

export function InvoicePanel() {
  const { data, refetch } = useApi<PagedResult<InvoiceDto> | InvoiceDto[]>(
    `${API_BASE.procurement}/api/v2/invoices`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line

  const items: InvoiceDto[] = Array.isArray(data) ? data :
    (data as PagedResult<InvoiceDto> | null)?.items ?? INVOICES_FALLBACK

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRecord, setShowRecord] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">Szállítói számlák</div>
          <div className="text-[11px] text-stone-500">{items.length} számla</div>
        </div>
        <button
          onClick={() => setShowRecord(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11.5px] font-medium hover:bg-indigo-700"
        >
          <Icon name="plus" size={12} />Számla rögzítése
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-stone-50/70 border-b border-stone-200">
              {['Számlaszám', 'Szállító', 'PO hivatkozás', 'Nettó', 'Bruttó', 'Dátum', 'Státusz'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((inv) => {
              const tone = INV_STATUS_STYLE[inv.status]
              return (
                <tr key={inv.id} onClick={() => setSelectedId(inv.id)}
                  className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 cursor-pointer">
                  <td className="px-4 py-2.5 font-mono text-stone-700">{inv.invoiceNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-stone-900">{inv.supplierName}</td>
                  <td className="px-4 py-2.5 font-mono text-stone-500 text-[11px]">{inv.poReference ?? '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-stone-700 text-right">{inv.totalNet.toLocaleString('hu-HU')} Ft</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-stone-900 text-right">{inv.totalGross.toLocaleString('hu-HU')} Ft</td>
                  <td className="px-4 py-2.5 font-mono text-stone-500">{inv.invoiceDate}</td>
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

      <InvoiceDetailSlideOver
        open={!!selectedId}
        invoiceId={selectedId ?? ''}
        onClose={() => setSelectedId(null)}
        onRefetch={refetch}
      />
      <RecordInvoiceDrawer
        open={showRecord}
        onClose={() => setShowRecord(false)}
        onCreated={() => { setShowRecord(false); refetch() }}
      />
    </div>
  )
}

// ─── InvoiceDetailSlideOver ───────────────────────────────────────────────────

interface DetailProps {
  open: boolean; invoiceId: string; onClose: () => void; onRefetch: () => void
}

function InvoiceDetailSlideOver({ open, invoiceId, onClose, onRefetch }: DetailProps) {
  const { data, refetch } = useApi<InvoiceDto>(
    invoiceId ? `${API_BASE.procurement}/api/v2/invoices/${invoiceId}` : null
  )
  useEffect(() => { if (open && invoiceId) refetch() }, [open, invoiceId]) // eslint-disable-line

  const inv: InvoiceDto = data ?? getMockInvoiceDetail(invoiceId)
  const tone = INV_STATUS_STYLE[inv.status]

  const [localStatus, setLocalStatus] = useState<InvoiceStatus>(inv.status)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  useEffect(() => { setLocalStatus(inv.status) }, [inv.status])

  // SoD: variance approver ≠ recorder
  const currentUser = 'Kovács P.'
  const isSoDViolation = inv.recordedBy === currentUser

  const { mutate } = useMutation<unknown>()
  const localTone = INV_STATUS_STYLE[localStatus]

  const canAct = localStatus === 'Received' || localStatus === 'Matched' || localStatus === 'Exception'
  const hasException = inv.lines.some((l) => l.matchStatus === 'Exception')
  const hasVariance = inv.lines.some((l) => (l.matchStatus === 'Exception' || l.matchStatus === 'Warning'))

  async function doAction(action: string, body?: unknown) {
    setActionLoading(action)
    try {
      await mutate(`${API_BASE.procurement}/api/v2/invoices/${invoiceId}/${action}`, { method: 'POST', body })
      if (action === 'approve' || action === 'approve-with-variance') {
        setLocalStatus('Approved')
        setActionDone('Számla jóváhagyva')
      }
      if (action === 'dispute') {
        setLocalStatus('Disputed')
        setShowDisputeForm(false)
        setActionDone('Számla vitásnak jelölve')
      }
      onRefetch()
    } catch { /* silent */ } finally {
      setActionLoading(null)
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={inv.invoiceNumber}
      subtitle={inv.supplierName}
      width={680}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-6">
        {/* Fejléc */}
        <div className="flex items-start gap-4 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10.5px] font-medium shrink-0 ${localTone.bg} ${localTone.fg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${localTone.dot}`} />
            {localTone.label}
          </span>
          <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">PO hivatkozás</dt><dd className="text-stone-900 font-mono">{inv.poReference ?? '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">Rögzítette</dt><dd className="text-stone-900">{inv.recordedBy}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-24 shrink-0">Számla dátuma</dt><dd className="text-stone-900 font-mono">{inv.invoiceDate}</dd></div>
          </dl>
        </div>

        {/* Tételsorok + Three-Way Match */}
        <div>
          <div className={SECTION}>Tételsorok — Three-Way Match</div>
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200">
                  {['Anyag', 'PO db', 'Száll. db', 'Számla db', 'Egységár', 'Összesen', 'Match'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((line: InvoiceLineDto) => {
                  const ms = line.matchStatus ? MATCH_STYLE[line.matchStatus] : null
                  return (
                    <tr key={line.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-3 py-2">
                        <div className="text-stone-900">{line.materialName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{line.materialCode}</div>
                      </td>
                      <td className="px-3 py-2 text-stone-600 tabular-nums">{line.poQty ?? '—'}</td>
                      <td className="px-3 py-2 text-stone-600 tabular-nums">{line.deliveredQty ?? '—'}</td>
                      <td className="px-3 py-2 text-stone-700 font-medium tabular-nums">{line.qty}</td>
                      <td className="px-3 py-2 text-stone-700 font-mono">{line.unitPrice.toLocaleString('hu-HU')}</td>
                      <td className="px-3 py-2 font-semibold text-stone-900 font-mono">{line.lineTotal.toLocaleString('hu-HU')}</td>
                      <td className="px-3 py-2">
                        {ms ? (
                          <div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium ${ms.bg} ${ms.fg}`}>
                              {ms.label}
                            </span>
                            {line.variancePct !== undefined && line.variancePct > 0 && (
                              <div className="text-[9.5px] text-stone-400 mt-0.5">{line.variancePct}% eltérés</div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50/70 border-t border-stone-200">
                  <td colSpan={5} className="px-3 py-2 text-right text-[11px] font-semibold text-stone-700">Nettó / ÁFA / Bruttó</td>
                  <td colSpan={2} className="px-3 py-2 text-[11.5px] font-mono font-semibold text-stone-900">
                    {inv.totalNet.toLocaleString('hu-HU')} / {inv.totalVat.toLocaleString('hu-HU')} / {inv.totalGross.toLocaleString('hu-HU')} Ft
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 3WM summary */}
          {hasException && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11.5px] text-amber-800">
              ⚠ Three-Way Match eltérést talált. Jóváhagyáshoz emelt jogkör szükséges (ApproveWithVariance).
            </div>
          )}
        </div>

        {/* SoD figyelmeztetés */}
        {isSoDViolation && canAct && hasVariance && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-600 text-[14px] shrink-0">⛔</span>
            <div className="text-[11.5px] text-red-800">
              <span className="font-semibold">SoD tiltás:</span> A variance jóváhagyó nem egyezhet a rögzítővel.
            </div>
          </div>
        )}

        {/* Akciók */}
        {canAct && (
          <div>
            <div className={SECTION}>Akciók</div>
            {!showDisputeForm ? (
              <div className="flex gap-2 flex-wrap">
                {!hasException && (
                  <button onClick={() => doAction('approve')} disabled={!!actionLoading}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60">
                    {actionLoading === 'approve' ? 'Folyamatban...' : '✓ Jóváhagyás'}
                  </button>
                )}
                {hasException && !isSoDViolation && (
                  <button onClick={() => doAction('approve-with-variance')} disabled={!!actionLoading}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-600 text-white text-[12px] font-medium hover:bg-amber-700 disabled:opacity-60">
                    {actionLoading === 'approve-with-variance' ? 'Folyamatban...' : '⚡ Jóváhagyás eltéréssel'}
                  </button>
                )}
                <button onClick={() => setShowDisputeForm(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-[12px] text-red-600 hover:bg-red-50">
                  ⚠ Vita jelölése
                </button>
              </div>
            ) : (
              <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 space-y-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Vita indoklása</label>
                  <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none resize-none"
                    placeholder="Mi az eltérés oka?" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => doAction('dispute', { reason: disputeReason })} disabled={!!actionLoading}
                    className="h-8 px-4 bg-red-600 text-white text-[11.5px] rounded-lg hover:bg-red-700 disabled:opacity-60">
                    {actionLoading === 'dispute' ? 'Folyamatban...' : 'Vita megerősítése'}
                  </button>
                  <button onClick={() => setShowDisputeForm(false)}
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

        {/* suppress unused warning */}
        {void tone}
      </div>
    </SlideOver>
  )
}

// ─── RecordInvoiceDrawer ──────────────────────────────────────────────────────

interface RecordProps { open: boolean; onClose: () => void; onCreated: () => void }

interface DraftLine { id: string; materialName: string; qty: string; unitPrice: string }

function RecordInvoiceDrawer({ open, onClose, onCreated }: RecordProps) {
  const [supplierName, setSupplierName] = useState('')
  const [poRef, setPoRef] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([
    { id: '1', materialName: '', qty: '', unitPrice: '' },
  ])
  const [apiError, setApiError] = useState('')
  const [touched, setTouched] = useState(false)

  const { mutate, isLoading: isSaving } = useMutation<unknown>()

  function reset() {
    setSupplierName(''); setPoRef(''); setInvoiceNumber(''); setInvoiceDate('')
    setLines([{ id: '1', materialName: '', qty: '', unitPrice: '' }])
    setApiError(''); setTouched(false)
  }

  function handleClose() { reset(); onClose() }

  function addLine() {
    setLines((p) => [...p, { id: Date.now().toString(), materialName: '', qty: '', unitPrice: '' }])
  }
  function removeLine(id: string) {
    setLines((p) => p.filter((l) => l.id !== id))
  }
  function updateLine(id: string, field: keyof DraftLine, val: string) {
    setLines((p) => p.map((l) => l.id === id ? { ...l, [field]: val } : l))
  }

  const lineTotal = (l: DraftLine) => (Number(l.qty) || 0) * (Number(l.unitPrice) || 0)
  const netTotal = lines.reduce((s, l) => s + lineTotal(l), 0)
  const vatTotal = Math.round(netTotal * INV_VAT_RATE)
  const grossTotal = netTotal + vatTotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!supplierName || !invoiceNumber || !invoiceDate) return
    setApiError('')
    try {
      await mutate(`${API_BASE.procurement}/api/v2/invoices`, {
        method: 'POST',
        body: {
          supplierName, poReference: poRef || undefined, invoiceNumber, invoiceDate,
          lines: lines.map((l) => ({
            materialName: l.materialName,
            qty: Number(l.qty), unitPrice: Number(l.unitPrice), vatRate: INV_VAT_RATE,
          })),
        },
      })
      reset(); onCreated()
    } catch { setApiError('Hiba történt a rögzítéskor') }
  }

  const err = touched && (!supplierName || !invoiceNumber || !invoiceDate)

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Számla rögzítése"
      subtitle="Szállítói számla bevitele"
      width={560}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button form="record-inv-form" type="submit" disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60">
            {isSaving ? 'Mentés...' : 'Számla rögzítése →'}
          </button>
        </>
      }
    >
      <form id="record-inv-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Szállító *</label>
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err && !supplierName ? 'border-red-400' : 'border-stone-200'}`}
              placeholder="Szállító neve" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Számlaszám *</label>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err && !invoiceNumber ? 'border-red-400' : 'border-stone-200'}`}
              placeholder="pl. SZ-2026-0442" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">PO hivatkozás</label>
            <input value={poRef} onChange={(e) => setPoRef(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              placeholder="Opcionális" />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">Számla dátuma *</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${err && !invoiceDate ? 'border-red-400' : 'border-stone-200'}`}
            />
          </div>
        </div>

        {/* Tételsorok */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tételsorok</div>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const lt = lineTotal(line)
              return (
                <div key={line.id} className="grid grid-cols-[1fr_70px_90px_80px_28px] gap-2 items-center">
                  <input value={line.materialName} onChange={(e) => updateLine(line.id, 'materialName', e.target.value)}
                    placeholder={`Tétel ${i + 1} megnevezése`}
                    className="h-8 px-2 rounded border border-stone-200 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <input type="number" value={line.qty} onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                    placeholder="db" className="h-8 px-2 rounded border border-stone-200 text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <input type="number" value={line.unitPrice} onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                    placeholder="Egységár" className="h-8 px-2 rounded border border-stone-200 text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <div className="text-[11px] font-mono text-stone-700 text-right">{lt > 0 ? lt.toLocaleString('hu-HU') : '—'}</div>
                  <button type="button" onClick={() => removeLine(line.id)} disabled={lines.length === 1}
                    className="w-6 h-6 grid place-items-center text-stone-300 hover:text-red-500 disabled:opacity-30">✕</button>
                </div>
              )
            })}
          </div>
          <button type="button" onClick={addLine}
            className="mt-2 text-[11.5px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
            <Icon name="plus" size={11} />Sor hozzáadása
          </button>
        </div>

        {/* Összeg */}
        {netTotal > 0 && (
          <div className="flex justify-end">
            <dl className="space-y-0.5 text-[12px] min-w-[180px]">
              <div className="flex justify-between gap-6"><dt className="text-stone-500">Nettó</dt><dd className="font-mono">{netTotal.toLocaleString('hu-HU')} Ft</dd></div>
              <div className="flex justify-between gap-6"><dt className="text-stone-500">ÁFA 27%</dt><dd className="font-mono text-stone-600">{vatTotal.toLocaleString('hu-HU')} Ft</dd></div>
              <div className="flex justify-between gap-6 pt-1 border-t border-stone-200"><dt className="font-semibold text-stone-900">Bruttó</dt><dd className="font-mono font-semibold">{grossTotal.toLocaleString('hu-HU')} Ft</dd></div>
            </dl>
          </div>
        )}
      </form>
    </SlideOver>
  )
}


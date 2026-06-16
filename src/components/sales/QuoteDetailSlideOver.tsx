import { useState, useEffect } from 'react'
import { SlideOver, GhostBtn, Icon } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  QUOTE_STATUS_MAP, calcVat, calcGross, fmtHuf,
  type QuoteDetailDto, type QuoteLineDto,
} from '../../data/data-sales-detail'

interface Props {
  open: boolean
  quoteId: string
  onClose: () => void
}

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

export function QuoteDetailSlideOver({ open, quoteId, onClose }: Props) {
  const { data, isLoading: quoteLoading, refetch } = useApi<QuoteDetailDto>(
    quoteId ? `${API_BASE.sales}/api/quotes/${quoteId}` : null
  )
  useEffect(() => { if (open && quoteId) refetch() }, [open, quoteId]) // eslint-disable-line

  const quote = data

  // Local lines state for optimistic updates
  const [lines, setLines] = useState<QuoteLineDto[]>([])
  useEffect(() => { setLines(quote?.lines ?? []) }, [quote?.id, data]) // eslint-disable-line

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  const vat = calcVat(subtotal)
  const gross = calcGross(subtotal)

  // Inline line editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editPrice, setEditPrice] = useState('')

  // New line form
  const [showNewLine, setShowNewLine] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newPrice, setNewPrice] = useState('')

  // Action forms
  const [actionForm, setActionForm] = useState<'send' | 'reject' | null>(null)
  const [sendDate, setSendDate] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState('')
  const [localStatus, setLocalStatus] = useState(quote?.status ?? 'Draft')
  useEffect(() => { if (quote?.status) setLocalStatus(quote.status) }, [quote?.status])

  const { mutate } = useMutation<unknown>()

  const isDraft = localStatus === 'Draft'
  const isSent = localStatus === 'Sent'
  const isAccepted = localStatus === 'Accepted'
  const isReadOnly = !isDraft

  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  })()

  function startEdit(line: QuoteLineDto) {
    if (isReadOnly) return
    setEditingId(line.id)
    setEditQty(String(line.quantity))
    setEditPrice(String(line.unitPrice))
  }

  async function saveEdit(lineId: string) {
    const qty = Number(editQty) || 1
    const price = Number(editPrice) || 0
    setLines((prev) =>
      prev.map((l) => l.id === lineId ? { ...l, quantity: qty, unitPrice: price, lineTotal: qty * price } : l)
    )
    setEditingId(null)
    try {
      await mutate(`${API_BASE.sales}/api/quotes/${quoteId}/lines/${lineId}`, {
        method: 'PUT', body: { quantity: qty, unitPrice: price },
      })
    } catch { /* silent, optimistic */ }
  }

  async function deleteLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.id !== lineId))
    try {
      await mutate(`${API_BASE.sales}/api/quotes/${quoteId}/lines/${lineId}`, { method: 'DELETE', body: undefined })
    } catch { /* silent */ }
  }

  async function addLine() {
    if (!newDesc || !newPrice) return
    const qty = Number(newQty) || 1
    const price = Number(newPrice)
    const newLine: QuoteLineDto = {
      id: `line-new-${Date.now()}`,
      description: newDesc,
      quantity: qty,
      unitPrice: price,
      lineTotal: qty * price,
    }
    setLines((prev) => [...prev, newLine])
    setShowNewLine(false)
    setNewDesc(''); setNewQty('1'); setNewPrice('')
    try {
      await mutate(`${API_BASE.sales}/api/quotes/${quoteId}/lines`, {
        method: 'POST', body: { description: newDesc, quantity: qty, unitPrice: price },
      })
    } catch { /* silent */ }
  }

  async function doAction(action: string, body?: unknown) {
    setActionLoading(action)
    setActionDone('')
    try {
      if (action === 'archive') {
        await mutate(`${API_BASE.sales}/api/quotes/${quoteId}`, { method: 'DELETE', body: undefined })
        setLocalStatus('Archived')
      } else {
        await mutate(`${API_BASE.sales}/api/quotes/${quoteId}/${action}`, { method: 'POST', body })
        if (action === 'send')    { setLocalStatus('Sent');              setActionForm(null) }
        if (action === 'accept')  { setLocalStatus('Accepted') }
        if (action === 'reject')  { setLocalStatus('Rejected');          setActionForm(null) }
        if (action === 'convert') {
          setLocalStatus('ConversionPending')
          setActionDone('Az ajánlat sikeresen megrendeléssé konvertálva. A Joinery modul feldolgozza.')
          setTimeout(() => { setLocalStatus('Converted'); setTimeout(onClose, 1200) }, 1600)
        }
      }
    } catch { /* silent */ } finally {
      setActionLoading(null)
    }
  }

  // CI-003: client-side derived expired state — backend stores 'Sent', FE computes display
  const todayStr = new Date().toISOString().slice(0, 10)
  const isExpiredDisplay = localStatus === 'Sent' && quote?.expiresAt != null && quote.expiresAt < todayStr
  const displayStatus = isExpiredDisplay ? 'Expired' : localStatus
  const tone = QUOTE_STATUS_MAP[displayStatus]

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={quote?.quoteNumber ?? '…'}
      subtitle={quote?.customerName ?? ''}
      width={680}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      {(quoteLoading || !quote) ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
      <div className="px-5 py-4 space-y-6">

        {/* Fejléc összefoglaló */}
        <div className="flex items-start gap-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10.5px] font-medium shrink-0 ${tone.bg} ${tone.fg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            {tone.label}
          </span>
          <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <div className="flex gap-2"><dt className="text-stone-500 w-20 shrink-0">Felelős</dt><dd className="text-stone-900">{quote.ownerName}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-20 shrink-0">Létrehozva</dt><dd className="text-stone-900 font-mono">{quote.createdAt}</dd></div>
            <div className="flex gap-2"><dt className="text-stone-500 w-20 shrink-0">Lejár</dt><dd className="text-stone-900 font-mono">{quote.expiresAt ?? '—'}</dd></div>
          </dl>
        </div>

        {/* Tételek */}
        <div>
          <div className={SECTION}>Tételek</div>
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200">
                  <th className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-6">#</th>
                  <th className="px-3 py-2 text-left text-[10.5px] text-stone-500 font-medium uppercase tracking-wide">Megnevezés</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-20">Menny.</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-28">Egységár</th>
                  <th className="px-3 py-2 text-right text-[10.5px] text-stone-500 font-medium uppercase tracking-wide w-28">Összesen</th>
                  {isDraft && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr
                    key={line.id}
                    onClick={() => startEdit(line)}
                    className={`border-b border-stone-100 last:border-0 ${isDraft ? 'cursor-pointer hover:bg-stone-50/60' : ''}`}
                  >
                    <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                    <td className="px-3 py-2 text-stone-900">{line.description}</td>
                    <td className="px-3 py-2 text-right">
                      {editingId === line.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditQty(e.target.value)}
                          onBlur={() => saveEdit(line.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(line.id)}
                          className="w-16 h-7 px-2 border border-indigo-300 rounded text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          autoFocus
                        />
                      ) : (
                        <span className="text-stone-700">{line.quantity}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editingId === line.id ? (
                        <input
                          type="number"
                          value={editPrice}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditPrice(e.target.value)}
                          onBlur={() => saveEdit(line.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(line.id)}
                          className="w-24 h-7 px-2 border border-indigo-300 rounded text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <span className="text-stone-700 font-mono">{line.unitPrice.toLocaleString('hu-HU')}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-stone-900 font-mono">
                      {line.lineTotal.toLocaleString('hu-HU')}
                    </td>
                    {isDraft && (
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLine(line.id) }}
                          className="w-6 h-6 grid place-items-center rounded text-stone-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Új tétel sor */}
                {isDraft && !showNewLine && (
                  <tr>
                    <td colSpan={6} className="px-3 py-2">
                      <button
                        onClick={() => setShowNewLine(true)}
                        className="text-[11.5px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <Icon name="plus" size={12} />Új tétel
                      </button>
                    </td>
                  </tr>
                )}
                {isDraft && showNewLine && (
                  <tr className="bg-indigo-50/40 border-t border-indigo-100">
                    <td className="px-3 py-2 text-stone-400">—</td>
                    <td className="px-3 py-2">
                      <input
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Megnevezés"
                        className="w-full h-7 px-2 border border-stone-200 rounded text-[11.5px] focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)}
                        className="w-full h-7 px-2 border border-stone-200 rounded text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Egységár"
                        className="w-full h-7 px-2 border border-stone-200 rounded text-[11.5px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    </td>
                    <td className="px-3 py-2 text-right text-stone-500 font-mono text-[11.5px]">
                      {((Number(newQty) || 0) * (Number(newPrice) || 0)).toLocaleString('hu-HU')}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={addLine}
                          className="h-6 px-2 bg-indigo-600 text-white text-[10.5px] rounded hover:bg-indigo-700">
                          OK
                        </button>
                        <button onClick={() => { setShowNewLine(false); setNewDesc(''); setNewQty('1'); setNewPrice('') }}
                          className="h-6 px-2 border border-stone-200 text-[10.5px] rounded hover:bg-stone-50">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Összegzés */}
          <div className="mt-3 flex justify-end">
            <dl className="space-y-1 text-[12px] min-w-[200px]">
              <div className="flex justify-between gap-8">
                <dt className="text-stone-500">Nettó</dt>
                <dd className="font-mono text-stone-900">{fmtHuf(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-8">
                <dt className="text-stone-500">ÁFA 27%</dt>
                <dd className="font-mono text-stone-600">{fmtHuf(vat)}</dd>
              </div>
              <div className="flex justify-between gap-8 pt-1 border-t border-stone-200">
                <dt className="font-semibold text-stone-900">Bruttó</dt>
                <dd className="font-mono font-semibold text-stone-900">{fmtHuf(gross)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Akciók */}
        {(isDraft || isSent || isAccepted) && (
          <div>
            <div className={SECTION}>Akciók</div>

            {/* Draft akciók */}
            {isDraft && actionForm === null && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActionForm('send')}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700"
                >
                  📤 Kiküldés
                </button>
                <button
                  onClick={() => doAction('archive')}
                  disabled={actionLoading === 'archive'}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-stone-200 text-[12px] text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  🗄 Archiválás
                </button>
              </div>
            )}

            {isDraft && actionForm === 'send' && (
              <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100 space-y-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
                    Érvényesség dátuma *
                  </label>
                  <input
                    type="date"
                    value={sendDate}
                    min={minDate}
                    onChange={(e) => setSendDate(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendDate && doAction('send', { validUntil: sendDate })}
                    disabled={!sendDate || actionLoading === 'send'}
                    className="h-8 px-4 bg-indigo-600 text-white text-[11.5px] font-medium rounded-lg disabled:opacity-50 hover:bg-indigo-700"
                  >
                    {actionLoading === 'send' ? 'Küldés...' : 'Elküldés megerősítése'}
                  </button>
                  <button onClick={() => setActionForm(null)}
                    className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-50">
                    Mégse
                  </button>
                </div>
              </div>
            )}

            {/* Sent akciók */}
            {isSent && actionForm === null && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => doAction('accept')}
                  disabled={actionLoading === 'accept'}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  ✅ Elfogadás
                </button>
                <button
                  onClick={() => setActionForm('reject')}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-[12px] text-red-600 hover:bg-red-50"
                >
                  ⛔ Elutasítás
                </button>
                <button
                  onClick={() => doAction('archive')}
                  disabled={actionLoading === 'archive'}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-stone-200 text-[12px] text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  🗄 Archiválás
                </button>
              </div>
            )}

            {isSent && actionForm === 'reject' && (
              <div className="p-4 bg-red-50/60 rounded-lg border border-red-100 space-y-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
                    Indoklás (opcionális)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-red-300/40 resize-none"
                    placeholder="Az elutasítás oka..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction('reject', { reason: rejectReason })}
                    disabled={actionLoading === 'reject'}
                    className="h-8 px-4 bg-red-600 text-white text-[11.5px] font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === 'reject' ? 'Elutasítás...' : 'Elutasítás megerősítése'}
                  </button>
                  <button onClick={() => setActionForm(null)}
                    className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-50">
                    Mégse
                  </button>
                </div>
              </div>
            )}

            {/* Accepted akciók */}
            {isAccepted && (
              <button
                onClick={() => doAction('convert')}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-teal-600 text-white text-[12px] font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {actionLoading === 'convert' ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Feldolgozás...</>
                ) : '🏭 Gyártásba konvertálás'}
              </button>
            )}
          </div>
        )}

        {/* Conversion success toast */}
        {actionDone && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[12px] text-teal-800">
            ✓ {actionDone}
          </div>
        )}
      </div>
      )}
    </SlideOver>
  )
}

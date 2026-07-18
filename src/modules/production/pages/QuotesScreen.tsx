import { useState } from 'react'
import { Button, QueryGate, SlideOver, StatusPill } from '../../../components/ui'
import { QUOTE_FSM, useQuoteMutation, useQuotes } from '../services'
import { transitionBlockReason } from '../../../services/fsmGuards'
import { QUOTE_STATUS_META, formatDate, formatMoney } from './labels'

const FILTERS = ['all', 'PendingReview', 'Quoted', 'ConvertedToOrder', 'Rejected'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Mind',
  PendingReview: QUOTE_STATUS_META.PendingReview.label,
  Quoted: QUOTE_STATUS_META.Quoted.label,
  ConvertedToOrder: QUOTE_STATUS_META.ConvertedToOrder.label,
  Rejected: QUOTE_STATUS_META.Rejected.label,
}

const statusLabels = Object.fromEntries(
  Object.entries(QUOTE_STATUS_META).map(([key, meta]) => [key, meta.label]),
) as Record<keyof typeof QUOTE_STATUS_META, string>

/**
 * Árajánlat-tracking (CuttingQuoteRequest, gyártó-oldal) — a publikus
 * (anonim) beadás/track NEM portál-felület (doksi 1.1); itt csak a döntés
 * (approve/reject) él, a KÖZÖS fsm.ts guardjával (400 tiltott átmenetre).
 * Mindkét döntés SlideOver-űrlapon megy (ár+deviza / indok kötelező —
 * a backend payload-guardját a UI is kikényszeríti, nincs kitalált alapérték).
 */
export function QuotesScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const quotes = useQuotes(filter === 'all' ? undefined : filter)
  const mutation = useQuoteMutation()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [priceAmount, setPriceAmount] = useState(0)
  const [priceCurrency, setPriceCurrency] = useState('HUF')
  const [rejectReasonText, setRejectReasonText] = useState('')

  const rows = quotes.data ?? []
  const approvingQuote = rows.find((q) => q.id === approvingId)
  const rejectingQuote = rows.find((q) => q.id === rejectingId)

  function closeApprove() {
    setApprovingId(null)
    setPriceAmount(0)
  }
  function closeReject() {
    setRejectingId(null)
    setRejectReasonText('')
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Árajánlatok</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          PendingReview → Quoted/Rejected — a publikus beadás és nyomkövetés nem portál-felület
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Státusz-szűrő">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`relative inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] transition before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring ${
              filter === f ? 'bg-world font-semibold text-world-fg' : 'bg-surface-2 font-medium text-ink-muted hover:text-ink'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <QueryGate isPending={quotes.isPending} isError={quotes.isError} onRetry={() => void quotes.refetch()} resource="árajánlatok">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-ink-muted">
            Nincs a szűrésnek megfelelő ajánlatkérés.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface-1">
            {rows.map((q) => {
              const approveReason = transitionBlockReason(QUOTE_FSM, 'approve', q.status, statusLabels)
              const rejectReason = transitionBlockReason(QUOTE_FSM, 'reject', q.status, statusLabels)
              return (
                <li key={q.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-ink">{q.customerName}</div>
                    <div className="truncate text-[10.5px] text-ink-muted">
                      {q.quoteNumber} · {q.itemCount} tétel · {formatDate(q.createdAt)}
                      {q.quotedPrice && ` · ${formatMoney(q.quotedPrice.amount, q.quotedPrice.currency)}`}
                    </div>
                  </div>
                  <StatusPill size="sm" tone={QUOTE_STATUS_META[q.status].tone} label={QUOTE_STATUS_META[q.status].label} />
                  <div className="flex gap-1.5">
                    <Button size="sm" disabledReason={approveReason} onClick={() => setApprovingId(q.id)}>
                      Jóváhagyás
                    </Button>
                    <Button size="sm" variant="destructive" disabledReason={rejectReason} onClick={() => setRejectingId(q.id)}>
                      Elutasítás
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </QueryGate>

      <SlideOver
        open={approvingId !== null}
        onClose={closeApprove}
        title={approvingQuote?.customerName ?? ''}
        subtitle="Ajánlat jóváhagyása"
        width={420}
        footer={
          <Button
            disabledReason={priceAmount <= 0 ? 'Adjon meg pozitív árat.' : undefined}
            onClick={() => {
              if (!approvingQuote) return
              mutation.mutate({
                id: approvingQuote.id, action: 'approve',
                payload: { quotedPriceAmount: priceAmount, quotedPriceCurrency: priceCurrency, customerEmail: approvingQuote.customerEmail },
              }, { onSuccess: closeApprove })
            }}
          >
            Jóváhagyás küldése
          </Button>
        }
      >
        <label className="block text-[12px]">
          <span className="mb-1 block font-medium text-ink">Ár</span>
          <input
            type="number" min={0} value={priceAmount}
            onChange={(e) => setPriceAmount(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-line bg-surface-card px-2 text-ink"
          />
        </label>
        <label className="mt-2 block text-[12px]">
          <span className="mb-1 block font-medium text-ink">Deviza</span>
          <input
            value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)}
            className="h-9 w-full rounded-md border border-line bg-surface-card px-2 text-ink"
          />
        </label>
      </SlideOver>

      <SlideOver
        open={rejectingId !== null}
        onClose={closeReject}
        title={rejectingQuote?.customerName ?? ''}
        subtitle="Ajánlatkérés elutasítása"
        width={420}
        footer={
          <Button
            variant="destructive"
            disabledReason={rejectReasonText.trim() === '' ? 'Adjon meg elutasítási indokot.' : undefined}
            onClick={() => {
              if (!rejectingQuote) return
              mutation.mutate({
                id: rejectingQuote.id, action: 'reject',
                payload: { reason: rejectReasonText, customerEmail: rejectingQuote.customerEmail },
              }, { onSuccess: closeReject })
            }}
          >
            Elutasítás küldése
          </Button>
        }
      >
        <label className="block text-[12px]">
          <span className="mb-1 block font-medium text-ink">Indok</span>
          <textarea
            value={rejectReasonText} onChange={(e) => setRejectReasonText(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-line bg-surface-card px-2 py-1.5 text-ink"
          />
        </label>
      </SlideOver>
    </div>
  )
}

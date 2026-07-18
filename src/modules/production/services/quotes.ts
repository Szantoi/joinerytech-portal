import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../services/apiClient'
import { useToast } from '../../../components/ui'
import { CUTTING_API, WASTE_WINDOW_DAYS } from './config'
import { productionKeys } from './keys'
import { QUOTE_STATUSES, type QuoteStatus } from './wire'
import { addDays, todayIso } from '../../../services/dateUtils'

/**
 * Árajánlat-követés (CuttingQuoteRequest) + waste-riport — doksi 1.1
 * quotes-csoport és `GET /api/cutting/waste`. A publikus (anonim) quote-
 * beadás/track NEM portál-felület — itt csak a gyártó-oldali lista + döntés
 * (approve/reject) él. Tiltott FSM-átmenet a backendben: Result.Invalid →
 * 400 (mag-csoport szemantika, doksi 1.0).
 */

// ── Sémák ───────────────────────────────────────────────────────────────────

export const quoteStatusSchema = z.enum(QUOTE_STATUSES)

/** QuoteRequestListItemDto (doksi 1.3). */
export const quoteListItemSchema = z.object({
  id: z.string(),
  quoteNumber: z.string(),
  status: quoteStatusSchema,
  customerEmail: z.string(),
  customerName: z.string(),
  itemCount: z.number(),
  createdAt: z.string(),
  quotedPrice: z.object({ amount: z.number(), currency: z.string() }).nullable(),
})
export type QuoteListItem = z.infer<typeof quoteListItemSchema>

/** WasteReportResponse (doksi 1.3) — ⚠ nincs napi/gépi bontás (P3 gap). */
export const wasteReportSchema = z.object({
  totalWasteAreaCm2: z.number(),
  averageWastePerExecution: z.number(),
  executionCount: z.number(),
})
export type WasteReport = z.infer<typeof wasteReportSchema>

/** Approve-payload (PUT /quotes/{id}/approve — doksi 1.1). */
export interface ApproveQuoteInput {
  quotedPriceAmount: number
  quotedPriceCurrency: string
  customerEmail: string
}

/** Reject-payload (PUT /quotes/{id}/reject). */
export interface RejectQuoteInput {
  reason: string
  customerEmail: string
}

// ── Fetcherek ───────────────────────────────────────────────────────────────

export function fetchQuotes(status?: QuoteStatus): Promise<QuoteListItem[]> {
  return apiFetch(`${CUTTING_API}/quotes/`, {
    query: { status },
    schema: z.array(quoteListItemSchema),
  })
}

export function approveQuote(id: string, input: ApproveQuoteInput): Promise<void> {
  return apiFetch(`${CUTTING_API}/quotes/${id}/approve`, { method: 'PUT', body: input })
}

export function rejectQuote(id: string, input: RejectQuoteInput): Promise<void> {
  return apiFetch(`${CUTTING_API}/quotes/${id}/reject`, { method: 'PUT', body: input })
}

/** Waste-riport a config-vezérelt ablakkal (default: utolsó WASTE_WINDOW_DAYS nap). */
export function fetchWasteReport(from?: string, to?: string): Promise<WasteReport> {
  const toDay = to ?? todayIso()
  const fromDay = from ?? addDays(toDay, -WASTE_WINDOW_DAYS)
  return apiFetch(`${CUTTING_API}/waste`, {
    query: { from: fromDay, to: toDay },
    schema: wasteReportSchema,
  })
}

// ── Hookok ──────────────────────────────────────────────────────────────────

export function useQuotes(status?: QuoteStatus) {
  return useQuery({
    queryKey: productionKeys.quotes(status ? { status } : undefined),
    queryFn: () => fetchQuotes(status),
  })
}

export function useWasteReport(from?: string, to?: string) {
  return useQuery({
    queryKey: productionKeys.waste({ from, to }),
    queryFn: () => fetchWasteReport(from, to),
  })
}

function useInvalidateQuotes() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...productionKeys.all, 'quotes'] })
  }
}

export type QuoteMutationInput =
  | { id: string; action: 'approve'; payload: ApproveQuoteInput }
  | { id: string; action: 'reject'; payload: RejectQuoteInput }

/** Ajánlat-döntés (approve/reject) — a végpontok üres 200-at adnak. */
export function useQuoteMutation() {
  const invalidate = useInvalidateQuotes()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, action, payload }: QuoteMutationInput) =>
      action === 'approve'
        ? approveQuote(id, payload as ApproveQuoteInput)
        : rejectQuote(id, payload as RejectQuoteInput),

    onSuccess: (_res, { action }) => {
      addToast(
        action === 'approve' ? 'Ajánlat kiküldve az ügyfélnek' : 'Ajánlatkérés elutasítva',
        'success',
      )
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'A döntés nem hajtható végre', 'error')
    },
    onSettled: () => invalidate(),
  })
}

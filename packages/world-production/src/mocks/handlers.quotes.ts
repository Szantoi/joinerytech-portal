import { http, HttpResponse } from 'msw'
import { CUTTING_API } from '../services/config'
import { QUOTE_FSM } from '../services/fsm'
import type { QuoteListItem } from '../services/quotes'
import { cuttingError, getProductionDb, guardFsm, notFound } from './db'
import { SEED_WASTE_PER_EXECUTION_CM2 } from './seed'

/**
 * Árajánlat + waste-riport handlerek — a doksi 1.1 quotes-csoport és a
 * `GET /api/cutting/waste` tükre. FSM-sértés → **400** (mag-csoport Ardalis
 * Invalid szemantika); a waste a lezárt végrehajtásokból számol (rule-6:
 * execution-mutáció után a riport is friss).
 */

const QUOTES_BASE = `${CUTTING_API}/quotes`
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function findQuote(id: string | readonly string[]): QuoteListItem | undefined {
  return getProductionDb().quotes.find((q) => q.id === id)
}

export const quoteHandlers = [
  http.get(`${QUOTES_BASE}/`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let rows = getProductionDb().quotes
    if (status) rows = rows.filter((q) => q.status === status)
    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(sorted)
  }),

  // Approve: PendingReview→Quoted — árazás + ügyfél-email kötelező
  http.put(`${QUOTES_BASE}/:id/approve`, async ({ params, request }) => {
    const quote = findQuote(params.id as string)
    if (!quote) return notFound('Ajánlatkérés')
    const guard = guardFsm(QUOTE_FSM, 'approve', quote.status, 400)
    if (guard) return guard

    const body = (await request.json()) as
      | { quotedPriceAmount?: number; quotedPriceCurrency?: string; customerEmail?: string }
      | null
    if (!body?.quotedPriceAmount || body.quotedPriceAmount <= 0 || !body.quotedPriceCurrency || !body.customerEmail) {
      return cuttingError(400, 'Invalid', 'quotedPriceAmount (>0), quotedPriceCurrency és customerEmail kötelező.')
    }

    quote.status = QUOTE_FSM.approve.to
    quote.quotedPrice = { amount: body.quotedPriceAmount, currency: body.quotedPriceCurrency }
    return HttpResponse.json({})
  }),

  // Reject: PendingReview→Rejected — indok + ügyfél-email kötelező
  http.put(`${QUOTES_BASE}/:id/reject`, async ({ params, request }) => {
    const quote = findQuote(params.id as string)
    if (!quote) return notFound('Ajánlatkérés')
    const guard = guardFsm(QUOTE_FSM, 'reject', quote.status, 400)
    if (guard) return guard

    const body = (await request.json()) as { reason?: string; customerEmail?: string } | null
    if (!body?.reason?.trim() || !body.customerEmail) {
      return cuttingError(400, 'Invalid', 'reason és customerEmail kötelező.')
    }

    quote.status = QUOTE_FSM.reject.to
    return HttpResponse.json({})
  }),

  // Waste-riport — 3 mezős összesítő (⚠ P3: nincs napi/gépi bontás)
  http.get(`${CUTTING_API}/waste`, ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to)) || (from && to && from > to)) {
      return cuttingError(400, 'Invalid', 'Érvénytelen riport-időszak (from ≤ to, yyyy-MM-dd).')
    }

    const completed = getProductionDb().executions.filter((e) => e.status === 'Completed')
    const executionCount = completed.length
    const totalWasteAreaCm2 = Math.round(executionCount * SEED_WASTE_PER_EXECUTION_CM2 * 10) / 10
    return HttpResponse.json({
      totalWasteAreaCm2,
      averageWastePerExecution: executionCount === 0 ? 0 : SEED_WASTE_PER_EXECUTION_CM2,
      executionCount,
    })
  }),
]

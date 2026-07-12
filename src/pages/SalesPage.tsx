import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon, SlideOver, GhostBtn } from '../components/ui'
import { WorldShell } from '../components/layout/WorldShell'
import { useApi, useMutation, API_BASE } from '../hooks/useApi'
import { useSalesDetail } from '../hooks/useSalesDetail'
import { SalesDetailHost } from '../components/sales/SalesDetailHost'
import {
  QUOTE_STATUS_MAP as STATUS_MAP, fmtM as fmt,
  type CustomerDto, type QuoteListItemDto, type PagedResult,
} from '../data/data-sales-detail'

// Local-only type for CreateCustomerSlideOver form
interface CreateCustomerForm {
  name: string; type: 'Lead' | 'Active'
  contactName: string; contactEmail: string; contactPhone: string; city: string
}

// ─── SalesWorldPage ──────────────────────────────────────────────────────────

export function SalesWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'
  const detail = useSalesDetail()

  function renderContent() {
    if (currentScreen === 'dash')      return <SalesDashboard onScreen={(s) => navigate(`/w/sales/${s}`)} onOpenQuote={detail.openQuoteDetail} />
    if (currentScreen === 'orders')    return <SalesOrders />
    if (currentScreen === 'quotes')    return <SalesQuotes onOpenQuote={detail.openQuoteDetail} onCreateQuote={detail.openCreateQuote} />
    if (currentScreen === 'customers') return <SalesCustomers onOpenCustomer={detail.openCustomerDetail} />
    return <SalesDashboard onScreen={(s) => navigate(`/w/sales/${s}`)} onOpenQuote={detail.openQuoteDetail} />
  }

  return (
    <WorldShell
      worldKey="sales"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/sales/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        {renderContent()}
      </div>
      <SalesDetailHost detail={detail} />
    </WorldShell>
  )
}

// Keep SalesPage as alias for backwards compatibility with tests
export { SalesWorldPage as SalesPage }

// ─── SalesDashboard ──────────────────────────────────────────────────────────

const FUNNEL = [
  { stage: 'Vázlat',      count: 4, value: 6_200_000,  color: 'bg-stone-300' },
  { stage: 'Kiküldve',    count: 9, value: 18_400_000, color: 'bg-sky-400' },
  { stage: 'Elfogadva',   count: 5, value: 24_900_000, color: 'bg-emerald-500' },
  { stage: 'Gyártásban',  count: 7, value: 31_200_000, color: 'bg-teal-500' },
  { stage: 'Kiszállítva', count: 3, value: 12_800_000, color: 'bg-stone-700' },
]

function SalesDashboard({ onScreen, onOpenQuote }: { onScreen: (s: string) => void; onOpenQuote?: (id: string) => void }) {
  const maxCount = Math.max(...FUNNEL.map((f) => f.count))

  const quotesUrl = `${API_BASE.sales}/api/quotes?pageSize=100`
  const customersUrl = `${API_BASE.sales}/api/customers?pageSize=5`
  const { data: quotesData, error: quotesError, refetch: refetchQuotes } = useApi<PagedResult<QuoteListItemDto>>(quotesUrl)
  const { data: customersData, error: customersError, refetch: refetchCustomers } = useApi<PagedResult<CustomerDto>>(customersUrl)

  useEffect(() => { refetchQuotes(); refetchCustomers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const quotes: QuoteListItemDto[] = quotesData?.items ?? []
  const customers: CustomerDto[] = customersData?.items ?? []
  const totalCustomers: number = customersData?.totalCount ?? 0

  // KPI computations
  const openQuotes = quotes.filter((q) => q.status === 'Sent' || q.status === 'Accepted')
  const pipelineValue = quotes
    .filter((q) => ['Sent', 'Accepted', 'ConversionPending'].includes(q.status))
    .reduce((sum, q) => sum + q.totalValue, 0)
  const acceptedCount = quotes.filter((q) => q.status === 'Accepted').length
  const denominator = quotes.filter((q) => ['Sent', 'Accepted', 'Rejected'].includes(q.status)).length
  const conversionRate = denominator > 0 ? Math.round((acceptedCount / denominator) * 100) + '%' : '—'

  const todayStr = new Date().toISOString().slice(0, 10)
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const sevenDaysStr = sevenDaysLater.toISOString().slice(0, 10)
  const soonExpiringCount = openQuotes.filter((q) => q.expiresAt && q.expiresAt <= sevenDaysStr).length

  const expiring = quotes
    .filter((q) => q.status === 'Sent' && q.expiresAt)
    .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''))
    .slice(0, 4)

  const topCustomers = [...customers].sort((a, b) => b.totalOrderValue - a.totalOrderValue).slice(0, 5)

  // suppress unused warning
  void quotesError; void customersError

  return (
    <div className="px-7 py-6 space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Összes ügyfél',     v: String(totalCustomers),    d: 'aktív és lead ügyfelek' },
          { l: 'Nyitott ajánlatok', v: String(openQuotes.length), d: `${soonExpiringCount} lejár 7 napon belül` },
          { l: 'Pipeline érték',    v: fmt(pipelineValue) + ' Ft', d: `${openQuotes.length} nyitott ajánlat` },
          { l: 'Konverziós ráta',   v: conversionRate,             d: 'elfogadás / kiküldés' },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.l}</div>
            <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1">{s.v}</div>
            <div className="text-[10.5px] text-stone-500 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline funnel */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-semibold text-stone-900">Pipeline</div>
            <div className="text-[11px] text-stone-500">Ajánlattól szállításig — aktuális állapot</div>
          </div>
          <button onClick={() => onScreen('quotes')} className="text-[11.5px] text-indigo-700 font-medium hover:underline">
            Ajánlatok →
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {FUNNEL.map((f) => {
            const w = (f.count / maxCount) * 100
            return (
              <div key={f.stage} className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{f.stage}</div>
                <div className="text-[26px] font-semibold tracking-tight text-stone-900 leading-none">{f.count}</div>
                <div className="text-[11px] text-stone-600 font-mono">{fmt(f.value)} Ft</div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className={`h-full ${f.color}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5">
          <svg viewBox="0 0 600 120" className="w-full h-24" preserveAspectRatio="none">
            {FUNNEL.map((f, i) => {
              const x0 = (i / FUNNEL.length) * 600
              const x1 = ((i + 1) / FUNNEL.length) * 600
              const h0 = 100 - (i / FUNNEL.length) * 50
              const h1 = 100 - ((i + 1) / FUNNEL.length) * 50
              const y0 = (120 - h0) / 2
              const y1 = (120 - h1) / 2
              const colors = ['#d6d3d1', '#7dd3fc', '#10b981', '#14b8a6', '#44403c']
              return (
                <path key={i}
                  d={`M ${x0},${y0} L ${x1},${y1} L ${x1},${y1 + h1} L ${x0},${y0 + h0} Z`}
                  fill={colors[i]} opacity="0.85"
                />
              )
            })}
          </svg>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lejáró ajánlatok */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-semibold text-stone-900">Lejáró ajánlatok</div>
              <div className="text-[11px] text-stone-500">Legkorábbi lejáratok</div>
            </div>
            <button onClick={() => onScreen('quotes')} className="text-[11.5px] text-indigo-700 font-medium hover:underline">
              Mind →
            </button>
          </div>
          <div className="space-y-1.5">
            {expiring.length === 0 && (
              <div className="text-[12px] text-stone-400 py-3 text-center">Nincs lejáró ajánlat</div>
            )}
            {expiring.map((q) => {
              const isExpired = q.expiresAt != null && q.expiresAt < todayStr
              const tone = STATUS_MAP[isExpired ? 'Expired' : q.status]
              return (
                <button key={q.id} onClick={() => onOpenQuote?.(q.id)} className="w-full grid grid-cols-[1fr_140px_120px_90px] gap-3 px-3 py-2.5 rounded-lg border border-stone-100 hover:bg-stone-50/40 items-center text-left">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-stone-900 truncate">{q.customerName}</div>
                    <div className="text-[10.5px] text-stone-500 font-mono">{q.quoteNumber}</div>
                  </div>
                  <div className="text-[11px] text-stone-600 font-mono">{q.expiresAt}</div>
                  <div className="text-[12px] font-semibold text-stone-900 font-mono text-right">{fmt(q.totalValue)} Ft</div>
                  <span className={`px-2 h-6 inline-flex items-center justify-center rounded-full text-[10px] font-medium ${tone.bg} ${tone.fg}`}>
                    {tone.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Top ügyfelek */}
        <Card className="p-5">
          <div className="text-[14px] font-semibold text-stone-900 mb-3">Top ügyfelek (LTV)</div>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-stone-50/50">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-[10px] font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-stone-900 truncate">{c.name}</div>
                  <div className="text-[10.5px] text-stone-500">{c.city}</div>
                </div>
                <div className="text-[11.5px] font-semibold text-stone-900 font-mono">{fmt(c.totalOrderValue)}M</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── SalesQuotes ─────────────────────────────────────────────────────────────

type QuoteFilter = 'all' | QuoteListItemDto['status']

const QUOTE_FILTER_KEYS: Array<{ key: QuoteFilter; label: string }> = [
  { key: 'all',      label: 'Összes' },
  { key: 'Draft',    label: 'Vázlat' },
  { key: 'Sent',     label: 'Kiküldve' },
  { key: 'Accepted', label: 'Elfogadva' },
  { key: 'Rejected', label: 'Elutasítva' },
  { key: 'Archived', label: 'Archivált' },
]

function SalesQuotes({ onOpenQuote, onCreateQuote }: { onOpenQuote?: (id: string) => void; onCreateQuote?: () => void }) {
  const [filter, setFilter] = useState<QuoteFilter>('all')

  const { data, isLoading, error, refetch } = useApi<PagedResult<QuoteListItemDto>>(
    `${API_BASE.sales}/api/quotes?pageSize=100`
  )
  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allQuotes: QuoteListItemDto[] = data?.items ?? []
  const list = filter === 'all' ? allQuotes : allQuotes.filter((q) => q.status === filter)
  const todayStr = new Date().toISOString().slice(0, 10)

  void error

  return (
    <div className="px-7 py-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {QUOTE_FILTER_KEYS.map((f) => {
          const count = f.key === 'all' ? allQuotes.length : allQuotes.filter((q) => q.status === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition inline-flex items-center gap-1.5 ${
                filter === f.key
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {f.label}
              <span className={`px-1.5 rounded text-[10px] tabular-nums ${
                filter === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
        <span className="flex-1" />
        <button
          onClick={onCreateQuote}
          className="h-8 px-3 bg-indigo-600 text-white text-[11.5px] font-medium rounded-lg inline-flex items-center gap-1.5 hover:bg-indigo-700"
        >
          <Icon name="plus" size={12} />Új ajánlat
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && (
          <div className="px-5 py-8 text-center">
            <div className="inline-block w-5 h-5 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
                {['Azonosító', 'Ügyfél', 'Dátum', 'Lejár', 'Tételek', 'Felelős', 'Státusz', 'Érték'].map((col, i) => (
                  <th key={col} className={`px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium${i === 7 ? ' text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((q) => {
                const isExpired = q.status === 'Sent' && q.expiresAt != null && q.expiresAt < todayStr
                const tone = STATUS_MAP[isExpired ? 'Expired' : q.status]
                return (
                  <tr key={q.id} onClick={() => onOpenQuote?.(q.id)} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/40 cursor-pointer">
                    <td className="px-5 py-2.5 font-mono text-stone-700">{q.quoteNumber}</td>
                    <td className="px-5 py-2.5 font-medium text-stone-900">{q.customerName}</td>
                    <td className="px-5 py-2.5 text-stone-600 font-mono">{q.createdAt}</td>
                    <td className="px-5 py-2.5 text-stone-600 font-mono">{q.expiresAt ?? '—'}</td>
                    <td className="px-5 py-2.5 text-stone-600">{q.lineCount}</td>
                    <td className="px-5 py-2.5 text-stone-700">{q.ownerName}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${tone.bg} ${tone.fg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                        {tone.label}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-stone-900 font-mono">
                      {q.totalValue.toLocaleString('hu-HU')} Ft
                    </td>
                  </tr>
                )
              })}
              {list.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[12px] text-stone-400">Nincs találat</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

// ─── SalesCustomers ──────────────────────────────────────────────────────────

function SalesCustomers({ onOpenCustomer }: { onOpenCustomer?: (id: string) => void }) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const url = `${API_BASE.sales}/api/customers?search=${encodeURIComponent(searchQuery)}&pageSize=20`
  const { data, isLoading, error, refetch } = useApi<PagedResult<CustomerDto>>(url)

  useEffect(() => { refetch() }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const customers: CustomerDto[] = data?.items ?? []
  const filtered = searchQuery && !data
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers

  void error

  return (
    <div className="px-7 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ügyfél keresése…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-stone-200 text-[12px] bg-white outline-none focus:border-stone-400"
          />
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        </div>
        <span className="flex-1" />
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-3 bg-indigo-600 text-white text-[11.5px] font-medium rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5"
        >
          <Icon name="plus" size={12} />Új ügyfél
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-stone-100 rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-stone-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => onOpenCustomer?.(c.id)} className="text-left w-full">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-[12px] font-semibold">
                  {c.name.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-stone-900 truncate">{c.name}</div>
                  <div className="text-[10.5px] text-stone-500">{c.city}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Kapcsolattartó</span>
                  <span className="font-medium text-stone-900">{c.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">E-mail</span>
                  <span className="font-mono text-stone-700 truncate ml-2 max-w-[160px]">{c.contactEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Telefon</span>
                  <span className="font-mono text-stone-700">{c.contactPhone}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="px-2 py-2 rounded-lg bg-stone-50 text-center">
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Nyitott</div>
                  <div className="text-[15px] font-semibold text-stone-900">{c.openQuoteCount}</div>
                </div>
                <div className="px-2 py-2 rounded-lg bg-stone-50 text-center">
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">LTV</div>
                  <div className="text-[15px] font-semibold text-stone-900">{fmt(c.totalOrderValue)}M</div>
                </div>
              </div>
            </Card>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[12px] text-stone-400">Nincs találat</div>
          )}
        </div>
      )}

      <CreateCustomerSlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onRefetch={() => refetch()}
      />
    </div>
  )
}

// ─── CreateCustomerSlideOver ─────────────────────────────────────────────────

interface CreateCustomerSlideOverProps {
  open: boolean
  onClose: () => void
  onRefetch: () => void
}

function CreateCustomerSlideOver({ open, onClose, onRefetch }: CreateCustomerSlideOverProps) {
  const { mutate, isLoading: isSaving, error: saveError } = useMutation<CustomerDto>()
  const emptyForm: CreateCustomerForm = {
    name: '', type: 'Lead', contactName: '', contactEmail: '', contactPhone: '', city: '',
  }
  const [form, setForm] = useState<CreateCustomerForm>(emptyForm)
  const [touched, setTouched] = useState<Partial<Record<keyof CreateCustomerForm, boolean>>>({})
  const [apiError, setApiError] = useState('')

  function reset() {
    setForm(emptyForm)
    setTouched({})
    setApiError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, contactName: true, contactEmail: true })
    if (!form.name || form.name.length < 2 || !form.contactName || !form.contactEmail) return
    setApiError('')
    try {
      await mutate(`${API_BASE.sales}/api/customers`, { method: 'POST', body: form })
      reset()
      onClose()
      onRefetch()
    } catch {
      setApiError(saveError ?? 'Hiba történt a létrehozáskor')
    }
  }

  const required: Array<{ key: keyof CreateCustomerForm; label: string; type: string }> = [
    { key: 'name', label: 'Cégnév', type: 'text' },
    { key: 'contactName', label: 'Kapcsolattartó neve', type: 'text' },
    { key: 'contactEmail', label: 'Email', type: 'email' },
  ]
  const optional: Array<{ key: keyof CreateCustomerForm; label: string; type: string }> = [
    { key: 'contactPhone', label: 'Telefon', type: 'tel' },
    { key: 'city', label: 'Város', type: 'text' },
  ]

  const isRequiredEmpty = (key: keyof CreateCustomerForm) =>
    touched[key] && !form[key]

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új ügyfél"
      width={400}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button
            form="create-customer-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Létrehozás...' : 'Létrehozás'}
          </button>
        </>
      }
    >
      <form id="create-customer-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Cégnév + type */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Cégnév *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
              isRequiredEmpty('name') ? 'border-red-400' : 'border-stone-200'
            }`}
          />
          {isRequiredEmpty('name') && (
            <p className="text-[11px] text-red-500 mt-0.5">
              {form.name.length > 0 ? 'Minimum 2 karakter' : 'Kötelező mező'}
            </p>
          )}
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Típus
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'Lead' | 'Active' }))}
            className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="Lead">Lead</option>
            <option value="Active">Aktív ügyfél</option>
          </select>
        </div>

        {required.slice(1).map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              {label} *
            </label>
            <input
              type={type}
              value={form[key] as string}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, [key]: true }))}
              className={`w-full h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                isRequiredEmpty(key) ? 'border-red-400' : 'border-stone-200'
              }`}
            />
            {isRequiredEmpty(key) && <p className="text-[11px] text-red-500 mt-0.5">Kötelező mező</p>}
          </div>
        ))}

        {optional.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
              {label}
            </label>
            <input
              type={type}
              value={form[key] as string}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        ))}
      </form>
    </SlideOver>
  )
}

// ─── SalesOrders ─────────────────────────────────────────────────────────────

function SalesOrders() {
  return (
    <div className="px-7 py-6 space-y-4">
      <div className="mx-0 mb-0 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11.5px] text-amber-800">
        A megrendelések a Gyártás modulban kezelhetők. Ez a nézet összesítő — élő adatok hamarosan.
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
              {['Rendelésszám', 'Ügyfél', 'Dátum', 'Tételek', 'Státusz', 'Érték'].map((col, i) => (
                <th key={col} className={`px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium${i === 5 ? ' text-right' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-[12px] text-stone-400">Nincs adat</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  )
}

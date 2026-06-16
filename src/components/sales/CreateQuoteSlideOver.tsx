import { useState, useEffect } from 'react'
import { SlideOver, GhostBtn, Icon } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  type CustomerDto, type PagedResult, type QuoteListItemDto,
} from '../../data/data-sales-detail'

interface Props {
  open: boolean
  onClose: () => void
  onQuoteCreated: (quoteId: string) => void
  prefillCustomerId?: string
  onOpenCreateCustomer?: () => void
}

export function CreateQuoteSlideOver({
  open, onClose, onQuoteCreated, prefillCustomerId, onOpenCreateCustomer,
}: Props) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState({ customer: false, expiresAt: false })
  const [apiError, setApiError] = useState('')

  const { mutate, isLoading: isSaving } = useMutation<QuoteListItemDto>()

  const tomorrow = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  })()

  // Customer typeahead
  const searchUrl = customerSearch.length >= 1
    ? `${API_BASE.sales}/api/customers?search=${encodeURIComponent(customerSearch)}&pageSize=6`
    : null
  const { data: searchData, refetch: refetchSearch } = useApi<PagedResult<CustomerDto>>(searchUrl)
  useEffect(() => { if (searchUrl) refetchSearch() }, [customerSearch]) // eslint-disable-line

  const searchResults: CustomerDto[] = searchData?.items ?? []

  // Prefill customer by ID from API
  const { data: prefillCustomerData } = useApi<CustomerDto>(
    prefillCustomerId && open ? `${API_BASE.sales}/api/customers/${prefillCustomerId}` : null
  )
  useEffect(() => {
    if (prefillCustomerData && open) {
      setSelectedCustomer(prefillCustomerData)
      setCustomerSearch(prefillCustomerData.name)
    }
  }, [prefillCustomerData, open]) // eslint-disable-line

  function reset() {
    setCustomerSearch(''); setSelectedCustomer(null); setShowDropdown(false)
    setExpiresAt(''); setNote(''); setTouched({ customer: false, expiresAt: false })
    setApiError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ customer: true, expiresAt: true })
    if (!selectedCustomer || !expiresAt || expiresAt < tomorrow) return
    setApiError('')
    try {
      const result = await mutate(`${API_BASE.sales}/api/quotes`, {
        method: 'POST',
        body: { customerId: selectedCustomer.id, expiresAt, note: note || undefined },
      })
      reset()
      onQuoteCreated(result.id)
    } catch {
      setApiError('Hiba történt az ajánlat létrehozásakor')
    }
  }

  const customerError = touched.customer && !selectedCustomer
  const dateError = touched.expiresAt && (!expiresAt || expiresAt < tomorrow)

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Új ajánlat létrehozása"
      subtitle="Az ajánlat vázlatként jön létre, majd szerkeszthető."
      width={500}
      footer={
        <>
          {apiError && <span className="text-[12px] text-red-500 flex-1">{apiError}</span>}
          <GhostBtn onClick={handleClose}>Mégse</GhostBtn>
          <button
            form="create-quote-form"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Létrehozás...' : 'Ajánlat létrehozása →'}
          </button>
        </>
      }
    >
      <form id="create-quote-form" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

        {/* Ügyfél typeahead */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Ügyfél *
          </label>
          <div className="relative">
            <div className="relative">
              <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setSelectedCustomer(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Ügyfél keresése..."
                className={`w-full h-9 pl-8 pr-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
                  customerError ? 'border-red-400' : 'border-stone-200'
                }`}
              />
            </div>
            {showDropdown && customerSearch.length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-stone-400">Nincs találat</div>
                ) : (
                  searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedCustomer(c)
                        setCustomerSearch(c.name)
                        setShowDropdown(false)
                      }}
                      className="w-full px-3 py-2.5 text-left hover:bg-stone-50 flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-[10px] font-semibold shrink-0">
                        {c.name.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-stone-900 truncate">{c.name}</div>
                        <div className="text-[10.5px] text-stone-500">{c.city}</div>
                      </div>
                    </button>
                  ))
                )}
                {onOpenCreateCustomer && (
                  <div className="border-t border-stone-100">
                    <button
                      type="button"
                      onMouseDown={onOpenCreateCustomer}
                      className="w-full px-3 py-2 text-left text-[12px] text-indigo-600 hover:bg-indigo-50 inline-flex items-center gap-1.5"
                    >
                      <Icon name="plus" size={12} />Új ügyfél létrehozása →
                    </button>
                  </div>
                )}
              </div>
            )}
            {!showDropdown && !selectedCustomer && customerSearch.length >= 1 && onOpenCreateCustomer && (
              <button
                type="button"
                onClick={onOpenCreateCustomer}
                className="mt-1 text-[11.5px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <Icon name="plus" size={11} />Új ügyfél létrehozása →
              </button>
            )}
          </div>
          {customerError && <p className="text-[11px] text-red-500 mt-0.5">Kérjük válasszon ügyfelet</p>}
        </div>

        {/* Érvényesség */}
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1 block">
            Érvényesség dátuma *
          </label>
          <input
            type="date"
            value={expiresAt}
            min={tomorrow}
            onChange={(e) => setExpiresAt(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, expiresAt: true }))}
            className={`h-9 px-3 rounded-lg border text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${
              dateError ? 'border-red-400' : 'border-stone-200'
            }`}
          />
          {dateError && (
            <p className="text-[11px] text-red-500 mt-0.5">
              {!expiresAt ? 'Kötelező mező' : 'Az érvényesség legalább holnap kell legyen'}
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
            maxLength={500}
            rows={3}
            placeholder="Belső megjegyzés (nem látja az ügyfél)"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none"
          />
          <div className="text-[10.5px] text-stone-400 text-right">{note.length}/500</div>
        </div>
      </form>
    </SlideOver>
  )
}

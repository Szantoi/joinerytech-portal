import { useState, useEffect } from 'react'
import { SlideOver, GhostBtn } from '../ui'
import { useApi, useMutation, API_BASE } from '../../hooks/useApi'
import {
  CUSTOMER_TYPE_STYLE, QUOTE_STATUS_MAP,
  type CustomerDetailDto, type QuoteListItemDto, type PagedResult,
} from '../../data/data-sales-detail'

interface Props {
  open: boolean
  customerId: string
  onClose: () => void
  onOpenQuote?: (quoteId: string) => void
}

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

export function CustomerDetailSlideOver({ open, customerId, onClose, onOpenQuote }: Props) {
  const { data: customerData, isLoading: customerLoading, refetch: refetchCustomer } = useApi<CustomerDetailDto>(
    customerId ? `${API_BASE.sales}/api/customers/${customerId}` : null
  )
  const { data: quotesData, refetch: refetchQuotes } = useApi<PagedResult<QuoteListItemDto>>(
    customerId ? `${API_BASE.sales}/api/quotes?customerId=${customerId}&pageSize=5` : null
  )
  useEffect(() => {
    if (open && customerId) { refetchCustomer(); refetchQuotes() }
  }, [open, customerId]) // eslint-disable-line

  const customer = customerData
  const recentQuotes: QuoteListItemDto[] = quotesData?.items ?? []

  const typeStyle = CUSTOMER_TYPE_STYLE[customer?.type ?? 'Active'] ?? CUSTOMER_TYPE_STYLE.Active
  const initials = (customer?.name ?? '').split(' ').slice(0, 2).map((s) => s[0]).join('')

  // Contact edit
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    contactName: customer?.contactName ?? '',
    contactEmail: customer?.contactEmail ?? '',
    contactPhone: customer?.contactPhone ?? '',
  })
  useEffect(() => {
    if (customer) {
      setContactForm({
        contactName: customer.contactName,
        contactEmail: customer.contactEmail,
        contactPhone: customer.contactPhone,
      })
    }
  }, [customer?.contactName, customer?.contactEmail, customer?.contactPhone]) // eslint-disable-line

  // Address collapsibles
  const [showBilling, setShowBilling] = useState(false)
  const [showShipping, setShowShipping] = useState(false)

  // FSM action
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localType, setLocalType] = useState(customer?.type ?? 'Active')
  const [confirmAction, setConfirmAction] = useState<'promote' | 'deactivate' | null>(null)
  useEffect(() => { if (customer?.type) setLocalType(customer.type) }, [customer?.type])

  const { mutate: mutateContact, isLoading: savingContact } = useMutation<unknown>()
  const { mutate: mutateAction } = useMutation<unknown>()

  async function saveContact() {
    try {
      await mutateContact(`${API_BASE.sales}/api/customers/${customerId}/contact`, {
        method: 'PUT', body: contactForm,
      })
    } catch { /* silent */ } finally {
      setEditingContact(false)
    }
  }

  async function doFsmAction(action: 'promote' | 'deactivate') {
    setActionLoading(action)
    setConfirmAction(null)
    try {
      await mutateAction(`${API_BASE.sales}/api/customers/${customerId}/${action}`, {
        method: 'POST', body: undefined,
      })
      if (action === 'promote')    setLocalType('Active')
      if (action === 'deactivate') setLocalType('Inactive')
    } catch { /* silent */ } finally {
      setActionLoading(null)
    }
  }

  const currentTypeStyle = CUSTOMER_TYPE_STYLE[localType] ?? CUSTOMER_TYPE_STYLE.Active

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={customer?.name ?? '…'}
      subtitle={customer ? `${customer.city} · ${currentTypeStyle.label}` : ''}
      width={520}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      {(customerLoading || !customer) ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
      <div className="px-5 py-4 space-y-5">

        {/* Avatar fejléc */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentTypeStyle.avatarFrom} ${currentTypeStyle.avatarTo} grid place-items-center text-[14px] font-semibold text-white shrink-0`}>
            {initials}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-stone-900">{customer.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${currentTypeStyle.bg} ${currentTypeStyle.fg}`}>
                {currentTypeStyle.label}
              </span>
              <span className="text-[10.5px] text-stone-500">{customer.city}</span>
            </div>
          </div>
        </div>

        {/* Kapcsolattartó */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className={SECTION} style={{ marginBottom: 0 }}>Kapcsolattartó</div>
            {!editingContact && (
              <button onClick={() => setEditingContact(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800">
                Szerkesztés
              </button>
            )}
          </div>
          {!editingContact ? (
            <dl className="space-y-1.5 text-[12px]">
              {[
                { label: 'Név', value: customer.contactName },
                { label: 'E-mail', value: customer.contactEmail },
                { label: 'Telefon', value: customer.contactPhone },
              ].map((row) => (
                <div key={row.label} className="flex gap-3">
                  <dt className="text-stone-500 w-20 shrink-0">{row.label}</dt>
                  <dd className="text-stone-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="space-y-2">
              {([ ['contactName', 'Kapcsolattartó neve'], ['contactEmail', 'E-mail'], ['contactPhone', 'Telefon'] ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5 block">{label}</label>
                  <input
                    value={contactForm[key]}
                    onChange={(e) => setContactForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-8 px-3 rounded-lg border border-stone-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveContact}
                  disabled={savingContact}
                  className="h-8 px-3 bg-indigo-600 text-white text-[11.5px] rounded-lg disabled:opacity-60 hover:bg-indigo-700"
                >
                  {savingContact ? 'Mentés...' : 'Mentés'}
                </button>
                <button onClick={() => setEditingContact(false)}
                  className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-50">
                  Mégse
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cím szekciók */}
        {customer.billingAddress && (
          <div>
            <button
              onClick={() => setShowBilling((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide w-full"
            >
              <span className={`transition-transform ${showBilling ? 'rotate-90' : ''}`}>▶</span>
              Számlázási cím
            </button>
            {showBilling && (
              <dl className="mt-2 space-y-1 text-[12px] pl-4">
                <div className="text-stone-700">{customer.billingAddress.zip} {customer.billingAddress.city}, {customer.billingAddress.street}</div>
                <div className="text-stone-500">{customer.billingAddress.country}</div>
              </dl>
            )}
          </div>
        )}
        {customer.shippingAddress && (
          <div>
            <button
              onClick={() => setShowShipping((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide w-full"
            >
              <span className={`transition-transform ${showShipping ? 'rotate-90' : ''}`}>▶</span>
              Szállítási cím
            </button>
            {showShipping && (
              <dl className="mt-2 space-y-1 text-[12px] pl-4">
                <div className="text-stone-700">{customer.shippingAddress.zip} {customer.shippingAddress.city}, {customer.shippingAddress.street}</div>
                <div className="text-stone-500">{customer.shippingAddress.country}</div>
              </dl>
            )}
          </div>
        )}

        {/* Utolsó ajánlatok */}
        <div>
          <div className={SECTION}>Utolsó ajánlatok</div>
          {recentQuotes.length === 0 ? (
            <div className="text-[12px] text-stone-400">Még nincs ajánlat</div>
          ) : (
            <div className="space-y-1">
              {recentQuotes.map((q) => {
                const tone = QUOTE_STATUS_MAP[q.status]
                return (
                  <button
                    key={q.id}
                    onClick={() => onOpenQuote?.(q.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-left"
                  >
                    <span className="text-[11.5px] font-mono text-stone-700 flex-1">{q.quoteNumber}</span>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
                      {tone.label}
                    </span>
                    <span className="text-[11.5px] font-mono text-stone-900">{q.totalValue.toLocaleString('hu-HU')} Ft</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* FSM akciók */}
        {(localType === 'Lead' || localType === 'Active') && (
          <div>
            <div className={SECTION}>Akciók</div>
            {confirmAction === null ? (
              <div className="flex gap-2 flex-wrap">
                {localType === 'Lead' && (
                  <button
                    onClick={() => setConfirmAction('promote')}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-indigo-200 text-[12px] text-indigo-700 hover:bg-indigo-50"
                  >
                    ⭐ Promóció → Aktív ügyfél
                  </button>
                )}
                {localType === 'Active' && (
                  <button
                    onClick={() => setConfirmAction('deactivate')}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-[12px] text-red-600 hover:bg-red-50"
                  >
                    Deaktiválás
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <p className="text-[12px] text-stone-700">
                  {confirmAction === 'promote'
                    ? 'Biztos? Az ügyfél aktívba kerül.'
                    : 'Biztos? Az ügyfél inaktívba kerül.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => doFsmAction(confirmAction)}
                    disabled={!!actionLoading}
                    className={`h-8 px-3 text-white text-[11.5px] rounded-lg disabled:opacity-60 ${
                      confirmAction === 'promote' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading ? 'Folyamatban...' : 'Igen, folytatom'}
                  </button>
                  <button onClick={() => setConfirmAction(null)}
                    className="h-8 px-3 border border-stone-200 text-[11.5px] rounded-lg hover:bg-stone-100">
                    Mégse
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </SlideOver>
  )
}

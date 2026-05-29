import { useState, useEffect } from 'react'
import { Card, StatusPill, PrimaryBtn } from '../components/ui'
import { SUPPLIERS, ACTIVE_PO, I18N } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'
import { PODetailSlideOver } from '../components/procurement/PODetailSlideOver'
import { SupplierSlideOver } from '../components/procurement/SupplierSlideOver'
import { NewPODrawer } from '../components/procurement/NewPODrawer'
import { RequisitionPanel } from '../components/procurement/RequisitionPanel'
import { InvoicePanel } from '../components/procurement/InvoicePanel'
import { PriceListPanel } from '../components/procurement/PriceListPanel'

type ProcTab = 'orders' | 'requisitions' | 'invoices' | 'pricelists'

const TABS: Array<{ key: ProcTab; label: string }> = [
  { key: 'orders',       label: 'Megrendelések' },
  { key: 'requisitions', label: 'Igénylések' },
  { key: 'invoices',     label: 'Számlák' },
  { key: 'pricelists',   label: 'Árlisták' },
]

interface ApiOrder {
  id: string
  supplierName: string
  totalAmount: number
  expectedDelivery: string
  status: string
  createdAt: string
}

interface ApiSupplier {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  leadTimeDays: number
  rating: number
  createdAt: string
}

const PO_STATUS_MAP: Record<string, { key: string; label: string }> = {
  Submitted: { key: 'planned',  label: 'Beküldve' },
  Approved:  { key: 'running',  label: 'Jóváhagyva' },
  Delivered: { key: 'done',     label: 'Szállítva' },
  Cancelled: { key: 'draft',    label: 'Törölve' },
}

function formatEta(iso: string): string {
  try { return iso.slice(0, 10) } catch { return '—' }
}

function isRealSupplier(name: string): boolean {
  return !name.startsWith('E2E') && name !== 'E2E-PROBE' && !name.includes('<script>')
}

export function ProcurementPage() {
  const t = I18N.hu
  const [activeTab, setActiveTab] = useState<ProcTab>('orders')

  const { data: apiOrders, refetch: fetchOrders } = useApi<ApiOrder[]>(
    `${API_BASE.procurement}/api/procurement/orders?pageSize=50`
  )
  const { data: apiSuppliers, refetch: fetchSuppliers } = useApi<ApiSupplier[]>(
    `${API_BASE.procurement}/api/procurement/suppliers`
  )

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // SlideOver state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id?: string; name: string } | null>(null)
  const [showNewPO, setShowNewPO] = useState(false)

  const displayOrders: Array<{
    rawId: string; id: string; supplier: string; material: string
    qty: string; eta: string; statusKey: string; statusLabel: string
  }> = apiOrders
    ? apiOrders.map(o => {
        const s = PO_STATUS_MAP[o.status] ?? { key: 'draft', label: o.status }
        return {
          rawId: o.id,
          id: o.id.slice(0, 8).toUpperCase(),
          supplier: o.supplierName,
          material: `${o.totalAmount.toLocaleString('hu-HU')} Ft`,
          qty: '—',
          eta: formatEta(o.expectedDelivery),
          statusKey: s.key,
          statusLabel: s.label,
        }
      })
    : ACTIVE_PO.map(p => ({
        rawId: p.id,
        id: p.id,
        supplier: p.supplier,
        material: p.material,
        qty: String(p.qty),
        eta: p.eta,
        statusKey: p.status,
        statusLabel: t.status[p.status as keyof typeof t.status] ?? p.status,
      }))

  const displaySuppliers: Array<{
    rawId?: string; name: string; sub: string; rating: string; leadTime: string
  }> = apiSuppliers
    ? apiSuppliers
        .filter(s => isRealSupplier(s.name))
        .map(s => ({
          rawId: s.id,
          name: s.name,
          sub: s.phone ?? s.email ?? '—',
          rating: s.rating > 0 ? s.rating.toFixed(1) : '—',
          leadTime: s.leadTimeDays > 0 ? `${s.leadTimeDays} nap` : '—',
        }))
    : SUPPLIERS.map(s => ({
        rawId: undefined,
        name: s.name,
        sub: s.city,
        rating: String(s.rating),
        leadTime: `${s.reliability}% megbízhatóság`,
      }))

  return (
    <div className="w-full px-7 py-6 max-w-[1400px] mx-auto space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* V2 panels */}
      {activeTab === 'requisitions' && <RequisitionPanel />}
      {activeTab === 'invoices'     && <InvoicePanel />}
      {activeTab === 'pricelists'   && <PriceListPanel />}

      {/* V1 megrendelések + szállítók */}
      {activeTab === 'orders' && (
      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-8 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-stone-900">{t.proc.activePO}</div>
            <PrimaryBtn icon="plus" onClick={() => setShowNewPO(true)}>{t.proc.newPO}</PrimaryBtn>
          </div>
          <div className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
            <div className="truncate">ID</div>
            <div>Szállító</div>
            <div>Összeg</div>
            <div className="text-right">Db</div>
            <div>{t.common.eta}</div>
            <div>Státusz</div>
          </div>
          {displayOrders.map((p) => (
            <div
              key={p.rawId}
              onClick={() => setSelectedOrderId(p.rawId)}
              className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60 cursor-pointer"
            >
              <div className="text-[11.5px] font-mono text-stone-500 truncate">{p.id}</div>
              <div className="text-[12.5px] font-medium text-stone-900 truncate">{p.supplier}</div>
              <div className="text-[12px] text-stone-600 truncate">{p.material}</div>
              <div className="text-[12px] tabular-nums text-right">{p.qty}</div>
              <div className="text-[11.5px] font-mono text-stone-500">{p.eta}</div>
              <div className="min-w-0">
                <StatusPill status={p.statusKey} label={p.statusLabel} />
              </div>
            </div>
          ))}
        </Card>

        <Card className="col-span-4 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 text-[12.5px] font-semibold text-stone-900">
            {t.proc.suppliers}
          </div>
          {displaySuppliers.map((s) => (
            <div
              key={s.name}
              onClick={() => setSelectedSupplier({ id: s.rawId, name: s.name })}
              className="px-5 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-stone-900 truncate">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.sub}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-medium text-amber-600 tabular-nums">★ {s.rating}</div>
                  <div className="text-[10.5px] text-stone-500 tabular-nums">{s.leadTime}</div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      )}

      {/* SlideOverek (always mounted) */}
      <PODetailSlideOver
        open={!!selectedOrderId}
        orderId={selectedOrderId ?? ''}
        onClose={() => setSelectedOrderId(null)}
      />

      <SupplierSlideOver
        open={!!selectedSupplier}
        supplierId={selectedSupplier?.id}
        supplierName={selectedSupplier?.name ?? ''}
        onClose={() => setSelectedSupplier(null)}
      />

      <NewPODrawer
        open={showNewPO}
        onClose={() => setShowNewPO(false)}
        onCreated={(id) => {
          setShowNewPO(false)
          setSelectedOrderId(id)
          fetchOrders()
        }}
      />
    </div>
  )
}

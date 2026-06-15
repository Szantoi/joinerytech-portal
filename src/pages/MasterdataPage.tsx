import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  PRODUCTS, MATERIALS, SUPPLIERS,
  PRODUCT_STATUS_META, MATERIAL_TYPE_META, SUPPLIER_STATUS_META,
  type MasterdataProduct, type MasterdataMaterial, type MasterdataSupplier,
} from '../mocks/masterdata'

// ── Helpers ────────────────────────────────────────────────────────────────
function huf(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M Ft'
  if (n >= 1_000)     return Math.round(n / 1_000) + ' eFt'
  return n + ' Ft'
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function MdKpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-3.5">
      <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className="text-[26px] font-semibold tracking-tight tabular-nums mt-1 text-stone-900">{value}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Product Status Pill ────────────────────────────────────────────────────
function ProductStatusPill({ status }: { status: MasterdataProduct['status'] }) {
  const m = PRODUCT_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Supplier Status Pill ───────────────────────────────────────────────────
function SupplierStatusPill({ status }: { status: MasterdataSupplier['status'] }) {
  const m = SUPPLIER_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Product Detail SlideOver ───────────────────────────────────────────────
function ProductDetailSlideOver({ product, onClose }: { product: MasterdataProduct | null; onClose: () => void }) {
  if (!product) return null
  const p = product
  return (
    <SlideOver open={true} onClose={onClose} title={p.name} subtitle={`${p.code} · ${p.category}`} width={460}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <ProductStatusPill status={p.status} />
          <span className="text-[12px] text-stone-500 font-mono">{p.code}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Lista ár</div>
            <div className="text-[16px] font-semibold text-stone-900 mt-1">{huf(p.price)}</div>
            <div className="text-[11px] text-stone-500">{p.unit}</div>
          </div>
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Kategória</div>
            <div className="text-[16px] font-semibold text-stone-900 mt-1">{p.category}</div>
          </div>
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Készlet</div>
            <div className={`text-[16px] font-semibold mt-1 ${p.stock <= p.minStock ? 'text-rose-700' : 'text-emerald-700'}`}>{p.stock} {p.unit}</div>
            <div className="text-[11px] text-stone-500">Min: {p.minStock} {p.unit}</div>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Supplier Detail SlideOver ──────────────────────────────────────────────
function SupplierDetailSlideOver({ supplier, onClose }: { supplier: MasterdataSupplier | null; onClose: () => void }) {
  if (!supplier) return null
  const s = supplier
  return (
    <SlideOver open={true} onClose={onClose} title={s.name} subtitle={s.category} width={460}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3">
          <SupplierStatusPill status={s.status} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Fizetési határidő</div>
            <div className="text-[16px] font-semibold text-stone-900 mt-1">{s.paymentTerm} nap</div>
          </div>
          <div className="bg-stone-50 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Átfutási idő</div>
            <div className="text-[16px] font-semibold text-stone-900 mt-1">{s.leadtime} nap</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Kapcsolattartó</div>
          <div className="flex items-center gap-2 text-[13px] text-stone-800">
            <Icon name="user" size={14} className="text-stone-400" />{s.contact}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-stone-800">
            <Icon name="phone" size={14} className="text-stone-400" />{s.phone}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function MasterdataDashboard() {
  const activeProducts = PRODUCTS.filter((p) => p.status === 'active').length
  const materialCount = MATERIALS.length
  const activeSuppliers = SUPPLIERS.filter((s) => s.status === 'active').length
  const lowStock = PRODUCTS.filter((p) => p.stock <= p.minStock).length

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-5">
      <div>
        <div className="text-[16px] font-semibold tracking-tight text-stone-900">Törzsadatok</div>
        <div className="text-[11.5px] text-stone-500">Termék, anyag és szállító nyilvántartás</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MdKpi label="Aktív termékek" value={activeProducts} sub={`${PRODUCTS.length} összesen`} />
        <MdKpi label="Anyag cikkszámok" value={materialCount} sub="aktív anyagok" />
        <MdKpi label="Aktív szállítók" value={activeSuppliers} sub={`${SUPPLIERS.length} összesen`} />
        <MdKpi label="Alacsony készlet" value={lowStock} sub="figyelmet igényel" />
      </div>

      {/* Low stock panel */}
      {lowStock > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-200/80 flex items-center gap-2">
            <Icon name="alert" size={14} className="text-amber-600" />
            <div className="text-[13px] font-semibold text-stone-900">Alacsony készletszint</div>
          </div>
          <div className="divide-y divide-stone-100">
            {PRODUCTS.filter((p) => p.stock <= p.minStock).map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-stone-900 truncate">{p.name}</div>
                  <div className="text-[11px] font-mono text-stone-400">{p.code}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-rose-700">{p.stock} {p.unit}</div>
                  <div className="text-[11px] text-stone-500">min: {p.minStock}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Products List ─────────────────────────────────────────────────────────
function ProductsList() {
  const [selected, setSelected] = useState<MasterdataProduct | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Termék-törzs</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(p)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-stone-900">{p.name}</span>
                  <ProductStatusPill status={p.status} />
                </div>
                <div className="text-[11px] text-stone-400 font-mono mt-0.5">{p.code} · {p.category}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-semibold text-stone-800">{huf(p.price)}</div>
                <div className={`text-[11px] ${p.stock <= p.minStock ? 'text-rose-600' : 'text-stone-500'}`}>{p.stock} {p.unit}</div>
              </div>
              <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
      <ProductDetailSlideOver product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Materials List ─────────────────────────────────────────────────────────
function MaterialsList() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Anyag-törzs</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {MATERIALS.map((m) => {
            const tm = MATERIAL_TYPE_META[m.type]
            return (
              <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium text-stone-900">{m.name}</span>
                    <span className={`inline-flex px-2 h-5 items-center rounded-full text-[10px] font-medium ${tm.bg} ${tm.fg}`}>{tm.label}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono mt-0.5">{m.code} · {m.supplier}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-stone-800">{huf(m.price)}/{m.unit}</div>
                  <div className="text-[11px] text-stone-500">{m.stock} {m.unit} raktáron</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── Suppliers List ─────────────────────────────────────────────────────────
function SuppliersList() {
  const [selected, setSelected] = useState<MasterdataSupplier | null>(null)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 space-y-4">
      <div className="text-[16px] font-semibold tracking-tight text-stone-900">Szállítók</div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {SUPPLIERS.map((s) => (
            <div key={s.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 cursor-pointer transition" onClick={() => setSelected(s)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-stone-900">{s.name}</span>
                  <SupplierStatusPill status={s.status} />
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">{s.category} · {s.contact}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] text-stone-600">{s.paymentTerm} nap fizetési hat.</div>
                <div className="text-[11px] text-stone-500">{s.leadtime} nap átfutás</div>
              </div>
              <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
      <SupplierDetailSlideOver supplier={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── World Page ─────────────────────────────────────────────────────────────
export function MasterdataWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'products')  return <ProductsList />
    if (currentScreen === 'materials') return <MaterialsList />
    if (currentScreen === 'suppliers') return <SuppliersList />
    return <MasterdataDashboard />
  }

  return (
    <WorldShell
      worldKey="masterdata"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/masterdata/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        {renderContent()}
      </div>
    </WorldShell>
  )
}

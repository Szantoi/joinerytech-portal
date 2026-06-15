import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  SHOP_PRODUCTS, SHOP_CART, SHOP_ORDERS,
  SHOP_PRODUCT_CATEGORY_META, SHOP_ORDER_STATUS_META,
  type ShopProduct, type ShopOrder, type ShopOrderStatus, type ShopProductCategory,
} from '../mocks/shop'

// ── Helpers ────────────────────────────────────────────────────────────────
function ProductCategoryBadge({ category }: { category: ShopProductCategory }) {
  const m = SHOP_PRODUCT_CATEGORY_META[category]
  return (
    <span className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium ${m.bg} ${m.fg}`}>{m.label}</span>
  )
}

function OrderStatusPill({ status }: { status: ShopOrderStatus }) {
  const m = SHOP_ORDER_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function formatFt(n: number) {
  return n.toLocaleString('hu-HU') + ' Ft'
}

// ── Order Detail SlideOver ─────────────────────────────────────────────────
function OrderDetailSlideOver({ order, onClose }: { order: ShopOrder | null; onClose: () => void }) {
  if (!order) return null
  return (
    <SlideOver open={true} onClose={onClose} title={`Rendelés — ${order.id}`} subtitle={`${order.id} · ${order.date}`} width={480}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <OrderStatusPill status={order.status} />
          <span className="text-[11.5px] text-stone-500">Szállítás: {order.deliveryDate}</span>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tételek</div>
          <div className="border border-stone-100 rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left px-3 py-2 text-[10.5px] text-stone-500 font-medium">Termék</th>
                  <th className="text-right px-3 py-2 text-[10.5px] text-stone-500 font-medium">db</th>
                  <th className="text-right px-3 py-2 text-[10.5px] text-stone-500 font-medium">Egységár</th>
                  <th className="text-right px-3 py-2 text-[10.5px] text-stone-500 font-medium">Összeg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-stone-800 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-right text-stone-600">{item.qty}</td>
                    <td className="px-3 py-2 text-right text-stone-600 font-mono">{formatFt(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right text-stone-800 font-mono font-medium">{formatFt(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2.5">
          <span className="text-[12px] font-semibold text-emerald-800">Nettó összesen</span>
          <span className="text-[14px] font-bold text-emerald-700 font-mono">{formatFt(order.totalNet)}</span>
        </div>

        {order.note && (
          <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11.5px] text-stone-600">
            {order.note}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Product Catalog ────────────────────────────────────────────────────────
function ProductCatalog() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Termék katalógus</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">B2B bútor- és vasalatrendszer</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SHOP_PRODUCTS.map((product: ShopProduct) => (
          <div key={product.id} className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-sm transition">
            <div className="mb-2">
              <ProductCategoryBadge category={product.category} />
            </div>
            <div className="text-[13px] font-semibold text-stone-900 mb-0.5">{product.name}</div>
            <div className="text-[11px] text-stone-400 font-mono mb-2">{product.code}</div>
            <div className="text-[14px] font-bold text-stone-800 font-mono mb-2">
              {formatFt(product.price)} <span className="text-[10.5px] font-normal text-stone-500">/ {product.unit}</span>
            </div>
            <div className={`text-[11px] font-medium ${product.stock <= 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {product.stock <= 3 ? 'Alacsony készlet' : 'Készleten'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Cart Panel ─────────────────────────────────────────────────────────────
function CartPanel() {
  const cartWithProducts = SHOP_CART.map((item) => {
    const product = SHOP_PRODUCTS.find((p) => p.id === item.productId)!
    return { ...item, product }
  })
  const total = cartWithProducts.reduce((sum, item) => sum + item.qty * item.product.price, 0)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">
          Kosárban <span className="text-stone-400 font-normal text-[16px]">({SHOP_CART.length} tétel)</span>
        </h1>
      </div>
      <div className="space-y-2 mb-4">
        {cartWithProducts.map((item) => (
          <div key={item.productId} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-900">{item.product.name}</div>
              <div className="text-[11.5px] text-stone-500 mt-0.5 font-mono">{formatFt(item.product.price)} / {item.product.unit}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[12px] text-stone-600">{item.qty} {item.product.unit}</div>
              <div className="text-[13px] font-bold text-stone-800 font-mono">{formatFt(item.qty * item.product.price)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-emerald-800">Nettó összesen</span>
        <span className="text-[16px] font-bold text-emerald-700 font-mono">{formatFt(total)}</span>
      </div>
    </div>
  )
}

// ── Orders List ────────────────────────────────────────────────────────────
function OrdersList() {
  const [selected, setSelected] = useState<ShopOrder | null>(null)
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Rendelések</h1>
      </div>
      <div className="space-y-2">
        {SHOP_ORDERS.map((order) => (
          <button key={order.id} onClick={() => setSelected(order)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-emerald-200 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <OrderStatusPill status={order.status} />
                <span className="text-[12px] font-mono text-stone-600">{order.id}</span>
              </div>
              <div className="text-[11.5px] text-stone-500">Rendelve: {order.date} · Szállítás: {order.deliveryDate}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-bold text-stone-800 font-mono">{formatFt(order.totalNet)}</div>
            </div>
          </button>
        ))}
      </div>
      <OrderDetailSlideOver order={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ── Shop Dashboard ─────────────────────────────────────────────────────────
function ShopDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const openOrders = SHOP_ORDERS.filter((o) => o.status !== 'lezart').length
  const todayDelivery = SHOP_ORDERS.filter((o) => o.deliveryDate === '2026-04-28').length
  const monthlyRevenue = SHOP_ORDERS.reduce((sum, o) => sum + o.totalNet, 0)
  const cartQty = SHOP_CART.reduce((sum, c) => sum + c.qty, 0)

  const KpiCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="text-[22px] font-semibold text-stone-900 leading-none mb-2">{value}</div>
      <div className="text-[12px] font-medium text-stone-700">{label}</div>
      <div className="text-[10.5px] text-stone-400 mt-0.5">{sub}</div>
    </div>
  )

  const recentOrders = SHOP_ORDERS.slice(0, 3)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Bolt</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">B2B termékrendelés és kosárkezelés</p>
        </div>
        <button onClick={() => onScreen('catalog')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-medium shrink-0">
          Katalógus
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Nyitott rendelések" value={String(openOrders)} sub="aktív" />
        <KpiCard label="Ma szállítandó" value={String(todayDelivery)} sub="2026-04-28" />
        <KpiCard label="Havi forgalom" value={formatFt(monthlyRevenue)} sub="összes rendelés" />
        <KpiCard label="Kosárban" value={`${cartQty} db`} sub="tételek száma" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-stone-800">Legutóbbi rendelések</span>
          <button onClick={() => onScreen('orders')} className="text-[11px] text-emerald-600 hover:text-emerald-800">Összes →</button>
        </div>
        <div className="divide-y divide-stone-50">
          {recentOrders.map((order) => (
            <div key={order.id} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <OrderStatusPill status={order.status} />
                  <span className="text-[12px] font-mono text-stone-600">{order.id}</span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono">Szállítás: {order.deliveryDate}</div>
              </div>
              <div className="shrink-0">
                <div className="text-[13px] font-bold text-stone-800 font-mono">{formatFt(order.totalNet)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Shop World Page ────────────────────────────────────────────────────────
export function ShopWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'catalog') return <ProductCatalog />
    if (currentScreen === 'cart')    return <CartPanel />
    if (currentScreen === 'orders')  return <OrdersList />
    return <ShopDashboard onScreen={(s) => navigate(`/w/shop/${s}`)} />
  }

  return (
    <WorldShell worldKey="shop" screen={currentScreen}
      onScreen={(key) => navigate(`/w/shop/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

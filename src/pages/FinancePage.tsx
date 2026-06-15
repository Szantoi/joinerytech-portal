import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  FIN_INVOICES_OUT, FIN_INVOICES_IN, FIN_PAYMENTS,
  FIN_INV_TONE, FIN_KIND_META, FIN_PAY_METHOD,
  type FinInvoice, type FinPayment, type PayMethod,
} from '../mocks/worlds'

// ── Helpers ───────────────────────────────────────────────────────────────────
function finNet(inv: FinInvoice): number {
  return (inv.lines ?? []).reduce((a, l) => a + l.qty * l.unitPrice, 0)
}
function finVat(inv: FinInvoice): number {
  return (inv.lines ?? []).reduce((a, l) => a + l.qty * l.unitPrice * (l.vat / 100), 0)
}
function finGross(inv: FinInvoice): number { return finNet(inv) + finVat(inv) }
function finToHuf(amount: number, inv: FinInvoice): number {
  return inv.currency === 'EUR' ? amount * (inv.fxRate ?? 392) : amount
}

function finFmt(n: number, currency = 'HUF'): string {
  if (currency === 'EUR') return n.toFixed(0) + ' €'
  n = Math.round(n)
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' M Ft'
  if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + ' eFt'
  return n + ' Ft'
}

const FIN_TODAY = '2026-04-28'

function isOverdue(inv: FinInvoice): boolean {
  if (inv.status === 'paid' || inv.status === 'void' || inv.status === 'draft') return false
  return inv.dueDate < FIN_TODAY
}

function effectiveStatus(inv: FinInvoice): string {
  if (inv.status === 'issued' && isOverdue(inv)) return 'overdue'
  return inv.status
}

function getBalance(inv: FinInvoice, payments: FinPayment[]): number {
  const gross = finGross(inv)
  const paid = payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0)
  return Math.max(0, gross - paid)
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function FinStatusPill({ inv, size = 'md' }: { inv: FinInvoice; size?: 'sm' | 'md' }) {
  const st = effectiveStatus(inv)
  const t = FIN_INV_TONE[st] ?? FIN_INV_TONE.draft
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10.5px]' : 'px-2 h-6 text-[11.5px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cls} ${t.bg} ${t.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{t.label}
    </span>
  )
}

function FinKindBadge({ kind }: { kind: string }) {
  const m = FIN_KIND_META[kind as keyof typeof FIN_KIND_META] ?? FIN_KIND_META.normal
  return <span className={`inline-flex items-center px-1.5 h-5 rounded text-[10px] font-medium ${m.tone}`}>{m.short}</span>
}

function FinMethodBadge({ method }: { method: PayMethod }) {
  const m = FIN_PAY_METHOD[method] ?? FIN_PAY_METHOD.bank
  return <span className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10.5px] font-medium ${m.tone}`}>{m.label}</span>
}

// ── Invoice Detail SlideOver ──────────────────────────────────────────────────
function InvoiceDetailSlideOver({ inv, payments, onClose }: {
  inv: FinInvoice | null; payments: FinPayment[]; onClose: () => void
}) {
  if (!inv) return null
  const invPayments = payments.filter((p) => p.invoiceId === inv.id)
  const paid = invPayments.reduce((s, p) => s + p.amount, 0)
  const gross = finGross(inv)
  const balance = Math.max(0, gross - paid)
  const overdue = isOverdue(inv)
  const isOut = inv.dir === 'out'
  const gross_huf = finToHuf(gross, inv)
  const vatGroups: Record<number, { net: number; vat: number }> = {}
  for (const l of inv.lines ?? []) {
    const net = l.qty * l.unitPrice
    if (!vatGroups[l.vat]) vatGroups[l.vat] = { net: 0, vat: 0 }
    vatGroups[l.vat].net += net
    vatGroups[l.vat].vat += net * (l.vat / 100)
  }

  return (
    <SlideOver open={!!inv} onClose={onClose}
      title={inv.id}
      subtitle={`${FIN_KIND_META[inv.kind as keyof typeof FIN_KIND_META]?.label ?? inv.kind} · ${inv.party}`}
      width={540}>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <FinStatusPill inv={inv} />
          <FinKindBadge kind={inv.kind} />
          {inv.currency === 'EUR' && (
            <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
              EUR · {inv.fxRate ?? 392} Ft
            </span>
          )}
        </div>

        {overdue && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 flex items-start gap-2 text-[11.5px] text-rose-700">
            <Icon name="alert" size={14} className="mt-px shrink-0" />
            <span>
              {isOut ? 'Lejárt kintlévőség' : 'Lejárt fizetendő'} — esedékesség: <strong>{inv.dueDate}</strong>
              {balance > 0 && <>. Hátralék: <strong>{finFmt(balance, inv.currency)}</strong></>}.
            </span>
          </div>
        )}

        {inv.submittedVia === 'supplier' && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 flex items-center gap-2 text-[11.5px] text-teal-700">
            <Icon name="storefront" size={14} className="shrink-0" />
            <span>Beszállító nyújtotta be portálon{inv.submittedAt ? ` (${inv.submittedAt})` : ''} — ellenőrizd, majd fogadd be.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          {[
            { label: isOut ? 'Vevő' : 'Szállító', val: inv.party },
            { label: isOut ? 'Rendelés' : 'Megrendelés (PO)', val: inv.orderRef || '—', mono: true },
            { label: 'Kiállítás', val: inv.issueDate, mono: true },
            { label: 'Fizetési határidő', val: inv.dueDate || '—', mono: true },
            ...(inv.extNo ? [{ label: 'Szállítói számlaszám', val: inv.extNo, mono: true }] : []),
            { label: 'Kiállító', val: inv.issuer || '—' },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">{f.label}</div>
              <div className={`text-stone-800 ${f.mono ? 'font-mono text-[11.5px]' : ''}`}>{f.val}</div>
            </div>
          ))}
        </div>

        {inv.note && (
          <div className="text-[11.5px] text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">{inv.note}</div>
        )}

        {/* Tételek */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tételek</div>
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_46px_88px_36px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-500 bg-stone-50/60 border-b border-stone-100">
              <div>Megnevezés</div><div className="text-right">Db</div><div className="text-right">Egységár</div><div className="text-right">ÁFA</div>
            </div>
            {(inv.lines ?? []).map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_46px_88px_36px] gap-2 px-3 py-2 border-b border-stone-100 last:border-0 text-[11.5px]">
                <div className="text-stone-700 truncate">{l.name}</div>
                <div className="text-right tabular-nums text-stone-600">{l.qty} {l.unit}</div>
                <div className="text-right tabular-nums text-stone-600">{finFmt(l.unitPrice, inv.currency)}</div>
                <div className="text-right tabular-nums text-stone-400">{l.vat}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* ÁFA bontás + összesítő */}
        <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">ÁFA-bontás</div>
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          {Object.entries(vatGroups).sort(([a], [b]) => Number(b) - Number(a)).map(([k, g]) => (
            <div key={k} className="grid grid-cols-3 gap-2 px-3 py-1.5 text-[11.5px] tabular-nums border-b border-stone-100 last:border-0">
              <span className="text-stone-500">{k}% kulcs</span>
              <span className="text-right text-stone-600">{finFmt(g.net, inv.currency)}</span>
              <span className="text-right text-stone-700">+{finFmt(g.vat, inv.currency)} ÁFA</span>
            </div>
          ))}
          <div className="px-3 py-2 bg-stone-50/40 space-y-1">
            <div className="flex justify-between text-[12px] text-stone-600"><span>Nettó</span><span className="tabular-nums">{finFmt(finNet(inv), inv.currency)}</span></div>
            <div className="flex justify-between text-[12px] text-stone-600"><span>ÁFA</span><span className="tabular-nums">{finFmt(finVat(inv), inv.currency)}</span></div>
            <div className="flex justify-between text-[14px] font-semibold text-stone-900"><span>Bruttó</span>
              <span className="tabular-nums">
                {finFmt(gross, inv.currency)}
                {inv.currency === 'EUR' && <span className="text-[11px] font-normal text-stone-400 ml-1">≈ {finFmt(gross_huf)}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Kifizetések */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">
              Kifizetések {invPayments.length > 0 ? `(${invPayments.length})` : ''}
            </div>
            <div className="text-[11px] text-stone-500">Fizetve: <span className="font-semibold text-stone-700 tabular-nums">{finFmt(paid, inv.currency)}</span></div>
          </div>
          {invPayments.length === 0 ? (
            <div className="text-[11.5px] text-stone-400 px-3 py-2 rounded-lg bg-stone-50 border border-dashed border-stone-200">Még nincs rögzített pénzmozgás.</div>
          ) : (
            <div className="space-y-1.5">
              {invPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50/70 border border-stone-100">
                  <FinMethodBadge method={p.method} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] text-stone-700 font-mono">{p.date}{p.ref ? ` · ${p.ref}` : ''}</div>
                    {p.note && <div className="text-[10.5px] text-stone-400 truncate">{p.note}</div>}
                  </div>
                  <div className="text-[12.5px] font-semibold tabular-nums text-stone-800">{finFmt(p.amount, inv.currency)}</div>
                </div>
              ))}
            </div>
          )}
          {balance > 0.01 && inv.status !== 'void' && inv.status !== 'draft' && (
            <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg ${overdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
              <span className="text-[12px] font-medium">Hátralék</span>
              <span className="text-[14px] font-bold tabular-nums">{finFmt(balance, inv.currency)}</span>
            </div>
          )}
        </div>

        {inv.voidReason && (
          <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 text-[11.5px] text-stone-500">
            <span className="font-medium text-stone-600">Sztornó indok:</span> {inv.voidReason}
          </div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Invoice Row ───────────────────────────────────────────────────────────────
function InvoiceRow({ inv, payments, onOpen }: { inv: FinInvoice; payments: FinPayment[]; onOpen: (inv: FinInvoice) => void }) {
  const gross = finGross(inv)
  const balance = getBalance(inv, payments)
  const overdue = isOverdue(inv)
  return (
    <button onClick={() => onOpen(inv)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left border-b border-stone-100 last:border-0 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-stone-900 truncate">{inv.party}</span>
          <FinKindBadge kind={inv.kind} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono text-stone-400 truncate">{inv.id}{inv.orderRef ? ` · ${inv.orderRef}` : ''}</span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end shrink-0">
        <FinStatusPill inv={inv} size="sm" />
        {balance > 0.01 && (inv.status === 'issued' || inv.status === 'partial') && (
          <span className={`text-[10px] mt-1 tabular-nums ${overdue ? 'text-rose-500' : 'text-stone-400'}`}>
            hátralék {finFmt(balance, inv.currency)}
          </span>
        )}
      </div>
      <div className="text-right shrink-0 w-24">
        <div className="text-[13px] font-semibold text-stone-800 tabular-nums">{finFmt(gross, inv.currency)}</div>
        <div className="text-[10.5px] font-mono text-stone-400">{inv.dueDate || inv.issueDate}</div>
      </div>
      <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
    </button>
  )
}

// ── Mini Stat Card ────────────────────────────────────────────────────────────
function FinMiniStat({ label, value, tone = 'stone', icon }: { label: string; value: string; tone?: string; icon: string }) {
  const tones: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    stone: 'bg-stone-100 text-stone-600',
  }
  return (
    <div className="bg-white border border-stone-200/80 rounded-xl px-3.5 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tones[tone] ?? tones.stone}`}>
        <Icon name={icon} size={17} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-wide text-stone-400 font-medium">{label}</div>
        <div className="text-[16px] font-semibold text-stone-900 tabular-nums leading-tight truncate">{value}</div>
      </div>
    </div>
  )
}

// ── Finance Dashboard ─────────────────────────────────────────────────────────
function FinanceDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const allOut = FIN_INVOICES_OUT
  const allIn = FIN_INVOICES_IN
  const FIN_PAYMENTS_local = FIN_PAYMENTS

  const receivable = allOut
    .filter((i) => i.status === 'issued' || i.status === 'partial')
    .reduce((s, i) => s + finToHuf(getBalance(i, FIN_PAYMENTS_local), i), 0)
  const payable = allIn
    .filter((i) => i.status === 'issued' || i.status === 'partial')
    .reduce((s, i) => s + finToHuf(getBalance(i, FIN_PAYMENTS_local), i), 0)
  const overdueOut = allOut.filter((i) => isOverdue(i)).length
  const overdueIn = allIn.filter((i) => isOverdue(i)).length
  const drafts = allOut.filter((i) => i.status === 'draft').length

  return (
    <div className="px-7 py-6 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinMiniStat label="Kintlévőség" value={finFmt(receivable)} tone="amber" icon="receipt" />
        <FinMiniStat label="Fizetendő" value={finFmt(payable)} tone="sky" icon="external" />
        <FinMiniStat label="Lejárt (ki)" value={`${overdueOut} db`} tone={overdueOut ? 'rose' : 'stone'} icon="alert" />
        <FinMiniStat label="Lejárt (be)" value={`${overdueIn} db`} tone={overdueIn ? 'rose' : 'stone'} icon="alert" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <div className="text-[13px] font-semibold text-stone-900">Legutóbbi kimenő számlák</div>
            <button onClick={() => onScreen('outgoing')} className="text-[11.5px] font-medium text-emerald-700">Mind →</button>
          </div>
          {allOut.slice(0, 4).map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-stone-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-stone-900 truncate">{inv.party}</div>
                <div className="text-[10.5px] text-stone-400 font-mono">{inv.id}</div>
              </div>
              <FinStatusPill inv={inv} size="sm" />
              <div className="text-[12px] font-semibold tabular-nums text-stone-700 w-20 text-right">{finFmt(finGross(inv), inv.currency)}</div>
            </div>
          ))}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <div className="text-[13px] font-semibold text-stone-900">Bejövő számlák</div>
            <button onClick={() => onScreen('incoming')} className="text-[11.5px] font-medium text-emerald-700">Mind →</button>
          </div>
          {allIn.slice(0, 4).map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-stone-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-stone-900 truncate">{inv.party}</div>
                <div className="text-[10.5px] text-stone-400 font-mono">{inv.id}</div>
              </div>
              <FinStatusPill inv={inv} size="sm" />
              <div className="text-[12px] font-semibold tabular-nums text-stone-700 w-20 text-right">{finFmt(finGross(inv), inv.currency)}</div>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-stone-500">Piszkozat kimenő:</span>
          <span className="font-semibold text-stone-900">{drafts} db</span>
          <span className="text-stone-500">Összes kifizetés:</span>
          <span className="font-semibold text-stone-900">{FIN_PAYMENTS_local.length} tétel</span>
        </div>
      </Card>
    </div>
  )
}

// ── Kimenő számlák lista ──────────────────────────────────────────────────────
const OUT_FILTERS = [
  { key: 'all', label: 'Mind' },
  { key: 'open', label: 'Nyitott' },
  { key: 'overdue', label: 'Lejárt' },
  { key: 'draft', label: 'Piszkozat' },
  { key: 'paid', label: 'Fizetve' },
]

function OutgoingInvoices({ onInv }: { onInv: (inv: FinInvoice) => void }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const rows = useMemo(() => FIN_INVOICES_OUT.filter((i) => {
    const eff = effectiveStatus(i)
    if (filter === 'open' && !['issued', 'partial', 'overdue'].includes(eff)) return false
    if (filter === 'overdue' && eff !== 'overdue') return false
    if (filter === 'draft' && i.status !== 'draft') return false
    if (filter === 'paid' && i.status !== 'paid') return false
    if (q && !`${i.id} ${i.party} ${i.orderRef ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [q, filter])

  const receivable = FIN_INVOICES_OUT
    .filter((i) => i.status === 'issued' || i.status === 'partial')
    .reduce((s, i) => s + finToHuf(getBalance(i, FIN_PAYMENTS), i), 0)

  return (
    <div className="px-7 py-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <FinMiniStat label="Kintlévőség" value={finFmt(receivable)} tone="amber" icon="receipt" />
        <FinMiniStat label="Lejárt számla" value={`${FIN_INVOICES_OUT.filter((i) => isOverdue(i)).length} db`}
          tone={FIN_INVOICES_OUT.some((i) => isOverdue(i)) ? 'rose' : 'stone'} icon="alert" />
        <FinMiniStat label="Piszkozat" value={`${FIN_INVOICES_OUT.filter((i) => i.status === 'draft').length} db`} tone="stone" icon="file" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {OUT_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] font-medium transition ${filter === f.key ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keresés: vevő, számlaszám…"
              className="h-8 w-48 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] outline-none focus:border-emerald-400 bg-stone-50/40" />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
        {rows.length === 0
          ? <div className="px-4 py-12 text-center text-[12.5px] text-stone-400">Nincs a szűrésnek megfelelő számla.</div>
          : <div>{rows.map((inv) => <InvoiceRow key={inv.id} inv={inv} payments={FIN_PAYMENTS} onOpen={onInv} />)}</div>}
      </Card>
    </div>
  )
}

// ── Bejövő számlák lista ──────────────────────────────────────────────────────
function IncomingInvoices({ onInv }: { onInv: (inv: FinInvoice) => void }) {
  const [q, setQ] = useState('')
  const rows = useMemo(() => FIN_INVOICES_IN.filter((i) =>
    !q || `${i.id} ${i.party} ${i.orderRef ?? ''} ${i.extNo ?? ''}`.toLowerCase().includes(q.toLowerCase())
  ), [q])

  const payable = FIN_INVOICES_IN
    .filter((i) => i.status === 'issued' || i.status === 'partial')
    .reduce((s, i) => s + finToHuf(getBalance(i, FIN_PAYMENTS), i), 0)

  return (
    <div className="px-7 py-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <FinMiniStat label="Fizetendő" value={finFmt(payable)} tone="sky" icon="external" />
        <FinMiniStat label="Lejárt fizetendő" value={`${FIN_INVOICES_IN.filter((i) => isOverdue(i)).length} db`}
          tone={FIN_INVOICES_IN.some((i) => isOverdue(i)) ? 'rose' : 'stone'} icon="alert" />
        <FinMiniStat label="Portálon benyújtott" value={`${FIN_INVOICES_IN.filter((i) => i.submittedVia === 'supplier').length} db`} tone="emerald" icon="storefront" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-stone-900">Bejövő számlák ({rows.length})</div>
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keresés…"
              className="h-8 w-44 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] outline-none focus:border-emerald-400 bg-stone-50/40" />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
        {rows.length === 0
          ? <div className="px-4 py-12 text-center text-[12.5px] text-stone-400">Nincs találat.</div>
          : <div>{rows.map((inv) => <InvoiceRow key={inv.id} inv={inv} payments={FIN_PAYMENTS} onOpen={onInv} />)}</div>}
      </Card>
    </div>
  )
}

// ── Kifizetések lista ─────────────────────────────────────────────────────────
function PaymentsPage() {
  const allInvoices = [...FIN_INVOICES_OUT, ...FIN_INVOICES_IN]
  return (
    <div className="px-7 py-6">
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <div className="text-[13px] font-semibold text-stone-900">Kifizetések ({FIN_PAYMENTS.length} tétel)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
                {['Dátum', 'Számla', 'Partner', 'Mód', 'Összeg', 'Megjegyzés'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...FIN_PAYMENTS].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
                const inv = allInvoices.find((i) => i.id === p.invoiceId)
                return (
                  <tr key={p.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                    <td className="px-4 py-2.5 font-mono text-stone-600 text-[11px]">{p.date}{p.ref ? ` · ${p.ref}` : ''}</td>
                    <td className="px-4 py-2.5 font-mono text-sky-700 text-[11px]">{p.invoiceId}</td>
                    <td className="px-4 py-2.5 text-stone-800">{inv?.party ?? p.who}</td>
                    <td className="px-4 py-2.5"><FinMethodBadge method={p.method} /></td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-stone-800">{finFmt(p.amount, inv?.currency)}</td>
                    <td className="px-4 py-2.5 text-stone-500 text-[11px] truncate max-w-[160px]">{p.note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── Finance World Page ────────────────────────────────────────────────────────
export function FinanceWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'
  const [selectedInv, setSelectedInv] = useState<FinInvoice | null>(null)

  function renderContent() {
    if (currentScreen === 'dash')     return <FinanceDashboard onScreen={(s) => navigate(`/w/finance/${s}`)} />
    if (currentScreen === 'outgoing') return <OutgoingInvoices onInv={setSelectedInv} />
    if (currentScreen === 'incoming') return <IncomingInvoices onInv={setSelectedInv} />
    if (currentScreen === 'payments') return <PaymentsPage />
    return <FinanceDashboard onScreen={(s) => navigate(`/w/finance/${s}`)} />
  }

  return (
    <WorldShell worldKey="finance" screen={currentScreen}
      onScreen={(key) => navigate(`/w/finance/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
      <InvoiceDetailSlideOver inv={selectedInv} payments={FIN_PAYMENTS} onClose={() => setSelectedInv(null)} />
    </WorldShell>
  )
}

export { FinanceWorldPage as FinancePage }

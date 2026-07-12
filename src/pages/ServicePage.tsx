import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import { SlideOver } from '../components/ui/SlideOver'
import { Icon } from '../components/ui'
import {
  SERVICE_TICKETS, SVC_WARRANTIES, SVC_VISITS,
  SVC_TYPE_META, SVC_STATUS_META, SVC_PRIORITY_META, SVC_STATUS_ORDER, SVC_VISIT_STATUS_META,
  svcSla, svcWarranty, isOpenTicket,
  type SvcTicket, type SvcStatus, type SvcType,
} from '../mocks/service'

// ── Atom pills ────────────────────────────────────────────────────────────────

function SvcStatusPill({ status }: { status: SvcStatus }) {
  const m = SVC_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 h-5 text-[10px] font-medium ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function SvcTypeBadge({ type }: { type: SvcType }) {
  const m = SVC_TYPE_META[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 h-5 text-[10px] font-medium ${m.pill}`}>
      {m.short}
    </span>
  )
}

function SvcPriorityPill({ priority }: { priority: SvcTicket['priority'] }) {
  const m = SVC_PRIORITY_META[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 h-5 text-[10px] font-medium ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

function SlaBadge({ ticket }: { ticket: SvcTicket }) {
  const sla = svcSla(ticket)
  if (!sla.active) return null
  if (sla.overdue)
    return <span className="inline-flex items-center rounded-full border px-2 h-5 text-[10px] font-medium bg-rose-50 text-rose-700 border-rose-200">SLA lejárt</span>
  if (sla.daysLeft <= 1)
    return <span className="inline-flex items-center rounded-full border px-2 h-5 text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-200">Határidő: holnap</span>
  return <span className="inline-flex items-center rounded-full border px-2 h-5 text-[10px] font-medium bg-sky-50 text-sky-700 border-sky-200">{sla.daysLeft} nap</span>
}

// ── Ticket Detail SlideOver ───────────────────────────────────────────────────

function TicketDetailSlideOver({ ticket, onClose }: { ticket: SvcTicket; onClose: () => void }) {
  const war = svcWarranty(ticket)
  const sla = svcSla(ticket)
  const visits = SVC_VISITS.filter((v) => v.ticketId === ticket.id)

  return (
    <SlideOver open onClose={onClose} title={ticket.title} subtitle={ticket.id}>
      <div className="space-y-5">
        {/* Status + pills */}
        <div className="flex flex-wrap gap-2">
          <SvcStatusPill status={ticket.status} />
          <SvcTypeBadge type={ticket.type} />
          <SvcPriorityPill priority={ticket.priority} />
          {sla.active && <SlaBadge ticket={ticket} />}
          {war.within && (
            <span className="inline-flex items-center rounded-full border px-2 h-5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
              Garanciában
            </span>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-stone-50 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Ügyfél</div>
          <div className="text-[13px] font-semibold text-stone-900">{ticket.customer}</div>
          <div className="text-[12px] text-stone-600">{ticket.contact} · {ticket.phone}</div>
          <div className="text-[12px] text-stone-500">{ticket.address}</div>
        </div>

        {/* Reference */}
        <div>
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Referencia</div>
          <div className="text-[13px] text-stone-800 font-mono">{ticket.ref}</div>
          <div className="text-[12px] text-stone-500">{ticket.refLabel}</div>
        </div>

        {/* Description */}
        <div>
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Leírás</div>
          <p className="text-[13px] text-stone-700 leading-relaxed">{ticket.desc}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-lg p-3">
            <div className="text-[10px] text-stone-400 mb-0.5">Bejelentve</div>
            <div className="text-[13px] font-medium text-stone-800">{ticket.reportedAt}</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3">
            <div className="text-[10px] text-stone-400 mb-0.5">Határidő</div>
            <div className={`text-[13px] font-medium ${sla.active && sla.overdue ? 'text-rose-600' : 'text-stone-800'}`}>{ticket.dueDate}</div>
          </div>
        </div>

        {/* Warranty info */}
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[10px] text-stone-400 mb-1">Garancia</div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-stone-700">Beépítve: {ticket.installedAt}</span>
            <span className="text-[12px] text-stone-700">Lejár: {war.expiresAt}</span>
          </div>
          <div className={`text-[11px] mt-1 font-medium ${war.within ? 'text-emerald-600' : 'text-rose-500'}`}>
            {war.within ? `Garanciában (${war.daysLeft} nap marad)` : 'Garanciából kiesett'}
          </div>
        </div>

        {/* Visits */}
        {visits.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Látogatások</div>
            <div className="space-y-2">
              {visits.map((v) => {
                const vm = SVC_VISIT_STATUS_META[v.status]
                return (
                  <div key={v.id} className="rounded-lg border border-stone-100 bg-white p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-stone-800">{v.date} · {v.timeSlot}</span>
                      <span className={`text-[10px] rounded-full border px-2 py-px ${vm.pill}`}>{vm.label}</span>
                    </div>
                    <div className="text-[11px] text-stone-500">{v.technician} · {v.note}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Photos placeholder */}
        <div>
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Fotók</div>
          <div className="rounded-xl border-2 border-dashed border-stone-200 h-20 flex items-center justify-center">
            <span className="text-[11px] text-stone-400">Fotó feltöltés — hamarosan</span>
          </div>
        </div>

        {/* Log */}
        <div>
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Eseménynapló</div>
          <div className="space-y-2">
            {ticket.log.map((entry, i) => (
              <div key={i} className="flex gap-2 text-[12px]">
                <span className="font-mono text-stone-400 shrink-0">{entry.at}</span>
                <span className="text-stone-700">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function ServiceDashboard() {
  const [selected, setSelected] = useState<SvcTicket | null>(null)

  const open = SERVICE_TICKETS.filter(isOpenTicket)
  const inSla = open.filter((t) => { const s = svcSla(t); return s.active && !s.overdue })
  const warrantyTickets = open.filter((t) => t.type === 'garancia')
  const todayVisits = SVC_VISITS.filter((v) => v.date === '2026-04-28' && v.status !== 'cancelled')

  const kpis = [
    { label: 'Nyitott jegy', value: open.length, sub: 'aktív reklamáció', color: 'text-orange-600' },
    { label: 'SLA-ban', value: inSla.length, sub: 'határidőn belül', color: 'text-emerald-600' },
    { label: 'Garanciás', value: warrantyTickets.length, sub: 'garancia-reklamáció', color: 'text-rose-600' },
    { label: 'Mai látogatás', value: todayVisits.length, sub: 'szerviz kiszállás', color: 'text-sky-600' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[13px] font-semibold text-stone-700 mt-0.5">{k.label}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-stone-700">Nyitott jegyek</span>
          <span className="text-[11px] text-stone-400">{open.length} db</span>
        </div>
        <div className="divide-y divide-stone-50">
          {open.slice(0, 5).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-stone-800 truncate">{t.title}</div>
                <div className="text-[11px] text-stone-400">{t.customer} · {t.id}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SvcTypeBadge type={t.type} />
                <SvcStatusPill status={t.status} />
                <SlaBadge ticket={t} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Today visits */}
      {todayVisits.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <span className="text-[13px] font-semibold text-stone-700">Mai kiszállások</span>
          </div>
          <div className="divide-y divide-stone-50">
            {todayVisits.map((v) => {
              const vm = SVC_VISIT_STATUS_META[v.status]
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-stone-800">{v.customer}</div>
                    <div className="text-[11px] text-stone-400">{v.timeSlot} · {v.technician}</div>
                    <div className="text-[11px] text-stone-400">{v.address}</div>
                  </div>
                  <span className={`text-[10px] rounded-full border px-2 py-px ${vm.pill}`}>{vm.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selected && <TicketDetailSlideOver ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ── Ticket list ───────────────────────────────────────────────────────────────

function ServiceTicketList() {
  const [selected, setSelected] = useState<SvcTicket | null>(null)
  const [statusFilter, setStatusFilter] = useState<SvcStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SvcType | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = SERVICE_TICKETS.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.customer.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés..."
          className="border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] w-44 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SvcStatus | 'all')}
          className="border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="all">Minden státusz</option>
          {SVC_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{SVC_STATUS_META[s].label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SvcType | 'all')}
          className="border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="all">Minden típus</option>
          {(Object.keys(SVC_TYPE_META) as SvcType[]).map((k) => (
            <option key={k} value={k}>{SVC_TYPE_META[k].short}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Jegy</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Ügyfél</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Tárgy</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Típus</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Státusz</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Prioritás</th>
                <th className="px-4 py-2.5 text-left font-semibold text-stone-500">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="hover:bg-stone-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-stone-500">{t.id}</td>
                  <td className="px-4 py-3 text-stone-800">{t.customer}</td>
                  <td className="px-4 py-3 text-stone-700 max-w-[200px] truncate">{t.title}</td>
                  <td className="px-4 py-3"><SvcTypeBadge type={t.type} /></td>
                  <td className="px-4 py-3"><SvcStatusPill status={t.status} /></td>
                  <td className="px-4 py-3"><SvcPriorityPill priority={t.priority} /></td>
                  <td className="px-4 py-3"><SlaBadge ticket={t} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-400">Nincs találat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <TicketDetailSlideOver ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ── Warranty panel ────────────────────────────────────────────────────────────

function ServiceWarranties() {
  const warStatusMeta = {
    active:   { label: 'Aktív',     pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    expiring: { label: 'Lejáró',    pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
    expired:  { label: 'Lejárt',    pill: 'bg-stone-100 text-stone-500 border-stone-200',      dot: 'bg-stone-400' },
  } as const

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-stone-700">Aktív garanciák</span>
          <span className="text-[11px] text-stone-400">{SVC_WARRANTIES.length} garancia</span>
        </div>
        <div className="divide-y divide-stone-50">
          {SVC_WARRANTIES.map((w) => {
            const sm = warStatusMeta[w.status]
            return (
              <div key={w.id} className="flex items-start gap-3 px-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-stone-800">{w.customer}</div>
                  <div className="text-[12px] text-stone-600 mt-0.5">{w.product}</div>
                  <div className="text-[11px] font-mono text-stone-400 mt-0.5">{w.ref}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 h-5 text-[10px] font-medium ${sm.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                  </span>
                  <div className="text-[11px] text-stone-400 mt-1">{w.installedAt} → {w.expiresAt}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Visit scheduler ───────────────────────────────────────────────────────────

function ServiceVisits() {
  const DAYS = ['2026-04-28', '2026-04-29', '2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04']
  const DAY_LABELS = ['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va']

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Week grid */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <span className="text-[13px] font-semibold text-stone-700">Heti látogatás-naptár (2026-W18)</span>
        </div>
        <div className="grid grid-cols-7 divide-x divide-stone-100">
          {DAYS.map((day, i) => {
            const dayVisits = SVC_VISITS.filter((v) => v.date === day)
            return (
              <div key={day} className="p-2 min-h-[120px]">
                <div className="text-[10px] font-semibold text-stone-400 text-center mb-1">{DAY_LABELS[i]}</div>
                <div className="text-[10px] text-stone-500 text-center mb-2">{day.slice(5)}</div>
                <div className="space-y-1">
                  {dayVisits.map((v) => {
                    const vm = SVC_VISIT_STATUS_META[v.status]
                    return (
                      <div key={v.id} className={`rounded p-1 text-[9px] leading-tight border ${vm.pill}`}>
                        <div className="font-semibold truncate">{v.customer.split(' ')[0]}</div>
                        <div>{v.timeSlot}</div>
                        <div>{v.technician.split(' ')[0]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Visit list */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100">
          <span className="text-[13px] font-semibold text-stone-700">Összes kiszállás</span>
        </div>
        <div className="divide-y divide-stone-50">
          {SVC_VISITS.map((v) => {
            const vm = SVC_VISIT_STATUS_META[v.status]
            return (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-stone-800">{v.customer}</div>
                  <div className="text-[11px] text-stone-500">{v.date} · {v.timeSlot} · {v.technician}</div>
                  <div className="text-[11px] text-stone-400">{v.address}</div>
                  {v.note && <div className="text-[11px] text-stone-500 italic mt-0.5">{v.note}</div>}
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <SvcTypeBadge type={v.type} />
                  <span className={`text-[10px] rounded-full border px-2 py-px ${vm.pill}`}>{vm.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── World page ────────────────────────────────────────────────────────────────

export function ServiceWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'dash')       return <ServiceDashboard />
    if (currentScreen === 'tickets')    return <ServiceTicketList />
    if (currentScreen === 'warranties') return <ServiceWarranties />
    if (currentScreen === 'visits')     return <ServiceVisits />
    return <ServiceDashboard />
  }

  return (
    <WorldShell
      worldKey="service"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/service/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">
        {renderContent()}
      </div>
    </WorldShell>
  )
}

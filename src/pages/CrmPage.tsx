import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  LEADS, OPPS, CRM_TASKS,
  LEAD_STATUS_META, OPP_STATUS_META, CRM_SOURCE_META,
  type Lead, type Opportunity, type LeadStatus, type OppStatus,
} from '../mocks/worlds'

// ── Helpers ───────────────────────────────────────────────────────────────────
function crmMoney(n: number): string {
  n = Number(n) || 0
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' M Ft'
  if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + ' eFt'
  return n + ' Ft'
}

function LeadStatusPill({ status, size = 'md' }: { status: LeadStatus; size?: 'sm' | 'md' }) {
  const t = LEAD_STATUS_META[status] ?? LEAD_STATUS_META.uj
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11.5px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cls} ${t.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{t.label}
    </span>
  )
}

function OppStatusPill({ status, size = 'md' }: { status: OppStatus; size?: 'sm' | 'md' }) {
  const t = OPP_STATUS_META[status] ?? OPP_STATUS_META.nyitott
  const cls = size === 'sm' ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11.5px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cls} ${t.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{t.label}
    </span>
  )
}

function SourcePill({ source }: { source: string }) {
  const t = CRM_SOURCE_META[source as keyof typeof CRM_SOURCE_META]
  if (!t) return <span className="text-[10.5px] text-stone-400">{source}</span>
  return (
    <span className={`inline-flex items-center px-1.5 h-5 rounded border text-[10px] font-medium ${t.pill}`}>{t.label}</span>
  )
}

// ── Lead Detail SlideOver ─────────────────────────────────────────────────────
function LeadDetailSlideOver({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null
  const t = LEAD_STATUS_META[lead.status]
  return (
    <SlideOver open={!!lead} onClose={onClose}
      title={lead.id}
      subtitle={`${lead.contact}${lead.company ? ` · ${lead.company}` : ''}`}
      width={520}>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <LeadStatusPill status={lead.status} />
          <SourcePill source={lead.source} />
          <span className="text-[11px] text-stone-500 ml-auto">{lead.owner}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Kontakt</div><div className="text-stone-800 font-medium">{lead.contact}</div></div>
          {lead.company && <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Cég</div><div className="text-stone-800">{lead.company}</div></div>}
          <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Email</div><div className="text-stone-800 font-mono text-[11px]">{lead.email}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Telefon</div><div className="text-stone-800 font-mono text-[11px]">{lead.phone}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Város</div><div className="text-stone-800">{lead.city}</div></div>
          <div><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Becsült érték</div><div className="text-stone-800 font-semibold tabular-nums">{crmMoney(lead.estValue)}</div></div>
          <div className="col-span-2"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Igény</div><div className="text-stone-700 text-[11.5px] leading-relaxed">{lead.interest}</div></div>
          {lead.referredBy && <div className="col-span-2"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">Ajánló</div><div className="text-stone-800">{lead.referredBy}</div></div>}
          {lead.lostReason && (
            <div className="col-span-2 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 text-[11.5px] text-stone-500">
              <span className="font-medium text-stone-600">Elvetés oka:</span> {lead.lostReason}
            </div>
          )}
          {lead.oppId && (
            <div className="col-span-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-[11.5px] text-indigo-700">
              Konvertálva lehetőséggé: <span className="font-mono font-medium">{lead.oppId}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tevékenységnapló</div>
          <div className="space-y-2">
            {lead.activities.map((a, i) => (
              <div key={i} className="flex gap-2 text-[11.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-stone-500 font-mono text-[10.5px]">{a.at} · <span className="text-stone-600">{a.who}</span></div>
                  <div className="text-stone-700">{a.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Opportunity Detail SlideOver ──────────────────────────────────────────────
function OppDetailSlideOver({ opp, onClose }: { opp: Opportunity | null; onClose: () => void }) {
  if (!opp) return null
  const prob = OPP_STATUS_META[opp.status]?.prob ?? 0
  const weighted = Math.round(opp.value * prob)
  return (
    <SlideOver open={!!opp} onClose={onClose}
      title={opp.id}
      subtitle={`${opp.customer} · ${opp.title}`}
      width={520}>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <OppStatusPill status={opp.status} />
          <SourcePill source={opp.source} />
          <span className="text-[11px] text-stone-500 ml-auto">{opp.owner}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ügyfél', val: opp.customer },
            { label: 'Kontakt', val: opp.contact },
            { label: 'Város', val: opp.city },
            { label: 'Várható zárás', val: opp.expectedClose },
            { label: 'Létrehozva', val: opp.createdAt },
            { label: 'Forrás lead', val: opp.fromLead ?? '—' },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-0.5">{f.label}</div>
              <div className="text-[13px] text-stone-800 font-mono">{f.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-stone-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-1">Értékek</div>
            <div className="text-[16px] font-semibold text-stone-900 tabular-nums">{crmMoney(opp.value)}</div>
          </div>
          <div className="rounded-xl border border-stone-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-1">Valószínűség</div>
            <div className="text-[16px] font-semibold text-indigo-700">{Math.round(prob * 100)}%</div>
          </div>
          <div className="rounded-xl border border-stone-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-stone-400 font-medium mb-1">Súlyozott</div>
            <div className="text-[16px] font-semibold text-stone-900 tabular-nums">{crmMoney(weighted)}</div>
          </div>
        </div>

        {opp.quoteId && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-[11.5px] text-indigo-700">
            Kapcsolt ajánlat: <span className="font-mono font-medium">{opp.quoteId}</span>
          </div>
        )}
        {opp.lostReason && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-[11.5px] text-rose-700">
            <span className="font-medium">Elvesztés oka:</span> {opp.lostReason}
          </div>
        )}

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tevékenységnapló</div>
          <div className="space-y-2">
            {opp.activities.map((a, i) => (
              <div key={i} className="flex gap-2 text-[11.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-stone-500 font-mono text-[10.5px]">{a.at} · <span className="text-stone-600">{a.who}</span></div>
                  <div className="text-stone-700">{a.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── CRM Dashboard ─────────────────────────────────────────────────────────────
function CrmDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const openLeads = LEADS.filter((l) => !['konvertalva', 'elvetve'].includes(l.status))
  const openOpps = OPPS.filter((o) => !['megnyert', 'elveszett'].includes(o.status))
  const pipeline = openOpps.reduce((s, o) => s + o.value, 0)
  const weighted = openOpps.reduce((s, o) => s + Math.round(o.value * (OPP_STATUS_META[o.status]?.prob ?? 0)), 0)
  const won = OPPS.filter((o) => o.status === 'megnyert').length
  const closed = OPPS.filter((o) => ['megnyert', 'elveszett'].includes(o.status)).length
  const winRate = closed ? Math.round((won / closed) * 100) : 0
  const conv = LEADS.filter((l) => l.status === 'konvertalva').length
  const closedLeads = LEADS.filter((l) => ['konvertalva', 'elvetve'].includes(l.status)).length
  const convRate = closedLeads ? Math.round((conv / closedLeads) * 100) : 0
  const openTasks = CRM_TASKS.filter((t) => !t.done)

  const kpis = [
    { label: 'Pipeline érték', value: crmMoney(pipeline), sub: `Súlyozott: ${crmMoney(weighted)}` },
    { label: 'Win rate', value: `${winRate}%`, sub: `${won}/${closed} lezárt` },
    { label: 'Lead konverzió', value: `${convRate}%`, sub: `${conv}/${closedLeads} konvertált` },
    { label: 'Nyitott feladatok', value: String(openTasks.length), sub: `${openTasks.filter((t) => t.priority === 'magas').length} magas prioritású` },
  ]

  return (
    <div className="px-7 py-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{k.label}</div>
            <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1 tabular-nums">{k.value}</div>
            <div className="text-[10.5px] text-stone-500 mt-1">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead pipeline mini */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-stone-900">Lead pipeline</div>
            <button onClick={() => onScreen('pipeline')} className="text-[11.5px] font-medium text-indigo-700 hover:text-indigo-900">
              Teljes pipeline →
            </button>
          </div>
          <div className="space-y-2">
            {(['uj', 'kapcsolat', 'minosites', 'nurturing'] as LeadStatus[]).map((st) => {
              const count = LEADS.filter((l) => l.status === st).length
              const t = LEAD_STATUS_META[st]
              return (
                <div key={st} className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-1.5 h-5 rounded-full border text-[10px] font-medium w-32 ${t.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${t.dot}`} />{t.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(100, count * 25)}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-stone-700 w-6 text-right tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Nyitott lehetőségek */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-stone-900">Nyitott lehetőségek</div>
            <button onClick={() => onScreen('opps')} className="text-[11.5px] font-medium text-indigo-700 hover:text-indigo-900">
              Mind →
            </button>
          </div>
          <div className="space-y-2">
            {openOpps.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-stone-900 truncate">{o.customer}</div>
                  <div className="text-[10.5px] text-stone-500 truncate">{o.title}</div>
                </div>
                <OppStatusPill status={o.status} size="sm" />
                <div className="text-[12px] font-semibold tabular-nums text-stone-800 w-20 text-right">{crmMoney(o.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Nyitott feladatok */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <div className="text-[13px] font-semibold text-stone-900">Nyitott feladatok</div>
        </div>
        <div className="divide-y divide-stone-50">
          {openTasks.slice(0, 5).map((t) => {
            const priorityColor = t.priority === 'magas' ? 'text-rose-600' : t.priority === 'kozepes' ? 'text-amber-600' : 'text-stone-400'
            return (
              <div key={t.id} className="px-5 py-2.5 flex items-center gap-3 text-[12px]">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'magas' ? 'bg-rose-500' : t.priority === 'kozepes' ? 'bg-amber-500' : 'bg-stone-300'}`} />
                <div className="flex-1 min-w-0 truncate text-stone-800">{t.title}</div>
                <span className={`text-[10.5px] font-medium ${priorityColor}`}>{t.priority}</span>
                <span className="font-mono text-[10.5px] text-stone-400">{t.due}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── Lead Pipeline (Kanban) ────────────────────────────────────────────────────
const PIPELINE_COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: 'uj', label: 'Új' },
  { key: 'kapcsolat', label: 'Kapcsolat' },
  { key: 'minosites', label: 'Minősítés' },
  { key: 'nurturing', label: 'Nurturing' },
  { key: 'konvertalva', label: 'Konvertálva' },
]

function PipelineKanban({ onLead }: { onLead: (l: Lead) => void }) {
  return (
    <div className="px-7 py-6">
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((col) => {
          const leads = LEADS.filter((l) => l.status === col.key)
          const t = LEAD_STATUS_META[col.key]
          return (
            <div key={col.key} className="w-56 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                <span className="text-[12px] font-semibold text-stone-900">{col.label}</span>
                <span className="ml-auto text-[11px] text-stone-400 font-mono">{leads.length}</span>
              </div>
              <div className="space-y-2">
                {leads.map((lead) => (
                  <button key={lead.id} onClick={() => onLead(lead)}
                    className="w-full text-left rounded-xl border border-stone-200 bg-white p-3 hover:border-indigo-300 hover:shadow-sm transition">
                    <div className="text-[12px] font-semibold text-stone-900 truncate">{lead.contact}</div>
                    {lead.company && <div className="text-[10.5px] text-stone-500 truncate">{lead.company}</div>}
                    <div className="text-[11px] text-stone-600 mt-1 truncate">{lead.title}</div>
                    <div className="flex items-center justify-between mt-2">
                      <SourcePill source={lead.source} />
                      <span className="text-[11px] font-semibold tabular-nums text-stone-700">{crmMoney(lead.estValue)}</span>
                    </div>
                  </button>
                ))}
                {leads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-stone-200 py-6 text-center text-[11px] text-stone-400">üres</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Lead Lista ────────────────────────────────────────────────────────────────
function LeadList({ onLead }: { onLead: (l: Lead) => void }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

  const filtered = useMemo(() => LEADS.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (q && !`${l.contact} ${l.company} ${l.title}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [q, statusFilter])

  return (
    <div className="px-7 py-6">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'uj', 'kapcsolat', 'minosites', 'nurturing', 'konvertalva', 'elvetve'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] font-medium transition ${statusFilter === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {s === 'all' ? 'Mind' : LEAD_STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keresés…"
              className="h-8 w-44 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] outline-none focus:border-indigo-400 bg-stone-50/40" />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-stone-400">Nincs találat.</div>
        ) : (
          <div>
            {filtered.map((lead) => (
              <button key={lead.id} onClick={() => onLead(lead)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left border-b border-stone-100 last:border-0 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-stone-900 truncate">{lead.contact}</span>
                    {lead.company && <span className="text-[11px] text-stone-500 truncate">{lead.company}</span>}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate mt-0.5">{lead.title}</div>
                </div>
                <SourcePill source={lead.source} />
                <LeadStatusPill status={lead.status} size="sm" />
                <div className="text-right shrink-0 w-20">
                  <div className="text-[12px] font-semibold tabular-nums text-stone-800">{crmMoney(lead.estValue)}</div>
                  <div className="text-[10px] text-stone-400 font-mono">{lead.createdAt}</div>
                </div>
                <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Opportunity Lista ─────────────────────────────────────────────────────────
function OppList({ onOpp }: { onOpp: (o: Opportunity) => void }) {
  const [statusFilter, setStatusFilter] = useState<OppStatus | 'open' | 'all'>('open')

  const filtered = useMemo(() => OPPS.filter((o) => {
    if (statusFilter === 'open') return !['megnyert', 'elveszett'].includes(o.status)
    if (statusFilter === 'all') return true
    return o.status === statusFilter
  }), [statusFilter])

  const totalValue = filtered.reduce((s, o) => s + o.value, 0)

  return (
    <div className="px-7 py-6">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'open', 'nyitott', 'igenyfelmeres', 'ajanlat', 'targyalas', 'megnyert', 'elveszett'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] font-medium transition ${statusFilter === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {s === 'all' ? 'Mind' : s === 'open' ? 'Nyitott' : OPP_STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="text-[11px] text-stone-500">
            {filtered.length} db · <span className="font-semibold tabular-nums">{crmMoney(totalValue)}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left border-b border-stone-100 bg-stone-50/50">
                {['Lehetőség', 'Ügyfél', 'Státusz', 'Érték', 'Várható zárás', 'Felelős'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => onOpp(o)}
                  className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 cursor-pointer">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-stone-900 truncate max-w-[200px]">{o.title}</div>
                    <div className="text-[10.5px] text-stone-400 font-mono">{o.id}</div>
                  </td>
                  <td className="px-4 py-2.5 text-stone-700">{o.customer}</td>
                  <td className="px-4 py-2.5"><OppStatusPill status={o.status} size="sm" /></td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums text-stone-800">{crmMoney(o.value)}</td>
                  <td className="px-4 py-2.5 font-mono text-stone-500 text-[11px]">{o.expectedClose}</td>
                  <td className="px-4 py-2.5 text-stone-600">{o.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="px-4 py-10 text-center text-[12px] text-stone-400">Nincs találat.</div>}
        </div>
      </Card>
    </div>
  )
}

// ── Forecast ──────────────────────────────────────────────────────────────────
function CrmForecast() {
  const openOpps = OPPS.filter((o) => !['megnyert', 'elveszett'].includes(o.status))
  const won = OPPS.filter((o) => o.status === 'megnyert')
  const pipeline = openOpps.reduce((s, o) => s + o.value, 0)
  const weighted = openOpps.reduce((s, o) => s + Math.round(o.value * (OPP_STATUS_META[o.status]?.prob ?? 0)), 0)
  const wonTotal = won.reduce((s, o) => s + o.value, 0)

  const byStage = (['nyitott', 'igenyfelmeres', 'osszeallitas', 'ajanlat', 'targyalas'] as OppStatus[]).map((st) => {
    const items = OPPS.filter((o) => o.status === st)
    return {
      st,
      count: items.length,
      value: items.reduce((s, o) => s + o.value, 0),
      prob: OPP_STATUS_META[st].prob,
    }
  })

  return (
    <div className="px-7 py-6 space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pipeline (bruttó)', val: crmMoney(pipeline), tone: 'text-stone-900' },
          { label: 'Súlyozott forecast', val: crmMoney(weighted), tone: 'text-indigo-700' },
          { label: 'Megnyert (YTD)', val: crmMoney(wonTotal), tone: 'text-emerald-700' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.label}</div>
            <div className={`text-[24px] font-semibold tracking-tight tabular-nums mt-1 ${s.tone}`}>{s.val}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 text-[13px] font-semibold text-stone-900">Forecast fázis szerint</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
              {['Fázis', 'Darab', 'Érték', 'Valószínűség', 'Súlyozott érték'].map((h) => (
                <th key={h} className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byStage.filter((r) => r.count > 0).map((r) => (
              <tr key={r.st} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-2.5"><OppStatusPill status={r.st as OppStatus} size="sm" /></td>
                <td className="px-5 py-2.5 tabular-nums text-stone-700">{r.count}</td>
                <td className="px-5 py-2.5 tabular-nums font-semibold text-stone-800">{crmMoney(r.value)}</td>
                <td className="px-5 py-2.5 tabular-nums text-indigo-600">{Math.round(r.prob * 100)}%</td>
                <td className="px-5 py-2.5 tabular-nums font-semibold text-stone-700">{crmMoney(Math.round(r.value * r.prob))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── CRM World Page ────────────────────────────────────────────────────────────
export function CrmWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)

  function renderContent() {
    if (currentScreen === 'dash')     return <CrmDashboard onScreen={(s) => navigate(`/w/crm/${s}`)} />
    if (currentScreen === 'pipeline') return <PipelineKanban onLead={setSelectedLead} />
    if (currentScreen === 'leads')    return <LeadList onLead={setSelectedLead} />
    if (currentScreen === 'opps')     return <OppList onOpp={setSelectedOpp} />
    if (currentScreen === 'forecast') return <CrmForecast />
    return <CrmDashboard onScreen={(s) => navigate(`/w/crm/${s}`)} />
  }

  return (
    <WorldShell worldKey="crm" screen={currentScreen}
      onScreen={(key) => navigate(`/w/crm/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
      <LeadDetailSlideOver lead={selectedLead} onClose={() => setSelectedLead(null)} />
      <OppDetailSlideOver opp={selectedOpp} onClose={() => setSelectedOpp(null)} />
    </WorldShell>
  )
}

export { CrmWorldPage as CrmPage }

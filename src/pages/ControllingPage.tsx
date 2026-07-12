import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  CTRL_PROJECTS, CTRL_CAT_META, CTRL_CAT_ORDER, PROJECT_STATUS_META,
  calcProject, calcPortfolio,
  ctrlHuf, ctrlHufM, ctrlPct, ctrlMarginTone, ctrlVarianceTone,
  type CtrlProject, type CtrlProjectCalc,
} from '../mocks/controlling'

// ── Helpers ────────────────────────────────────────────────────────────────────
function MarginBar({ revenue, cost }: { revenue: number; cost: number }) {
  const r = Math.max(1, revenue)
  const costPct = Math.max(0, Math.min(100, (cost / r) * 100))
  const pct = revenue > 0 ? (revenue - cost) / revenue : null
  const t = ctrlMarginTone(pct)
  return (
    <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden flex">
      <div className="h-full bg-stone-300" style={{ width: costPct + '%' }} />
      <div className={`h-full ${t.bar}`} style={{ width: (100 - costPct) + '%' }} />
    </div>
  )
}

function MarginPill({ pct }: { pct: number | null }) {
  const t = ctrlMarginTone(pct)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 h-6 text-[11px] font-medium ${t.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{ctrlPct(pct)} · {t.label}
    </span>
  )
}

function VarPill({ diff }: { diff: number }) {
  const t = ctrlVarianceTone(diff)
  if (Math.abs(diff) < 1) return <span className={`inline-flex items-center rounded-full border px-2 h-6 text-[11px] font-medium ${t.pill}`}>terv szerint</span>
  return (
    <span className={`inline-flex items-center rounded-full border px-2 h-6 text-[11px] font-medium ${t.pill}`}>
      {t.sign}{ctrlHuf(Math.abs(diff)).replace(' Ft', '')} Ft
    </span>
  )
}

function ProjectStatusPill({ status }: { status: CtrlProject['status'] }) {
  const m = PROJECT_STATUS_META[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2 h-5 text-[10px] font-medium ${m.pill}`}>{m.label}</span>
  )
}

// ── Project Controlling Detail SlideOver ───────────────────────────────────────
function ProjectDetailSlideOver({ calc, onClose }: { calc: CtrlProjectCalc | null; onClose: () => void }) {
  if (!calc) return null
  const { project: p } = calc
  return (
    <SlideOver open={true} onClose={onClose} title={p.name} subtitle={p.customer} width={600}>
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          <ProjectStatusPill status={p.status} />
          <MarginPill pct={calc.actualMarginPct} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Szerződéses érték</div>
            <div className="text-[15px] font-semibold text-stone-900">{ctrlHuf(p.contractValue)}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Számlázott</div>
            <div className="text-[15px] font-semibold text-stone-900">{ctrlHuf(p.invoiced)}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Terv-összköltség</div>
            <div className="text-[14px] font-medium text-stone-800">{ctrlHuf(calc.planTotal)}</div>
          </div>
          <div>
            <div className="text-[10.5px] text-stone-400 mb-0.5">Tény-összköltség</div>
            <div className="text-[14px] font-medium text-stone-800">{ctrlHuf(calc.actualTotal)}</div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-stone-400 mb-1.5">Fedezet-sáv</div>
          <MarginBar revenue={p.contractValue} cost={calc.actualTotal} />
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Kategória-bontás</div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-stone-400 text-[10.5px] border-b border-stone-100">
                <th className="text-left pb-2">Kategória</th>
                <th className="text-right pb-2">Terv</th>
                <th className="text-right pb-2">Tény</th>
                <th className="text-right pb-2">Eltérés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {CTRL_CAT_ORDER.map((cat) => {
                const catLines = p.lines.filter((l) => l.cat === cat)
                if (!catLines.length) return null
                const plan   = catLines.reduce((s, l) => s + l.plan, 0)
                const actual = catLines.reduce((s, l) => s + l.actual, 0)
                const diff = actual - plan
                const m = CTRL_CAT_META[cat]
                const t = ctrlVarianceTone(diff)
                if (plan === 0 && actual === 0) return null
                return (
                  <tr key={cat}>
                    <td className="py-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 h-5 rounded-full border ${m.pill}`}>{m.label}</span>
                    </td>
                    <td className="py-1.5 text-right text-stone-600 tabular-nums">{ctrlHufM(plan)}</td>
                    <td className="py-1.5 text-right text-stone-800 tabular-nums font-medium">{ctrlHufM(actual)}</td>
                    <td className={`py-1.5 text-right tabular-nums ${t.fg}`}>{diff === 0 ? '—' : `${t.sign}${ctrlHufM(Math.abs(diff))}`}</td>
                  </tr>
                )
              })}
              <tr className="border-t border-stone-200 font-semibold">
                <td className="pt-2 text-stone-700">Összesen</td>
                <td className="pt-2 text-right text-stone-700 tabular-nums">{ctrlHufM(calc.planTotal)}</td>
                <td className="pt-2 text-right text-stone-900 tabular-nums">{ctrlHufM(calc.actualTotal)}</td>
                <td className={`pt-2 text-right tabular-nums ${ctrlVarianceTone(calc.variance).fg}`}>
                  {calc.variance === 0 ? '—' : `${ctrlVarianceTone(calc.variance).sign}${ctrlHufM(Math.abs(calc.variance))}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SlideOver>
  )
}

// ── Controlling Dashboard ──────────────────────────────────────────────────────
function ControllingDashboard() {
  const [openCalc, setOpenCalc] = useState<CtrlProjectCalc | null>(null)
  const pf = calcPortfolio()
  const T = pf.totals

  const KPI = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'rose' | 'emerald' | 'amber' }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="text-[11px] uppercase tracking-wide text-stone-400 font-medium">{label}</div>
      <div className={`text-[22px] font-semibold leading-none mt-1.5 ${
        tone === 'rose' ? 'text-rose-700' : tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-stone-900'
      }`}>{value}</div>
      {sub && <div className="text-[10.5px] text-stone-400 mt-1">{sub}</div>}
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kontrolling</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Projekt-jövedelmezőség — terv vs. tény utókalkuláció</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI label="Portfólió érték"  value={ctrlHufM(T.contract) + ' M Ft'} sub={`Számlázva: ${ctrlHufM(T.invoiced)} M`} />
        <KPI label="Terv-fedezet"     value={ctrlPct(T.planMarginPct)}   sub={`Tervköltség: ${ctrlHufM(T.planTotal)} M`} />
        <KPI label="Tény-fedezet"     value={ctrlPct(T.actualMarginPct)} sub={`Tényköltség: ${ctrlHufM(T.actualTotal)} M`}
          tone={(T.actualMarginPct ?? 0) < 0.15 ? 'rose' : 'emerald'} />
        <KPI label="Eltérés (Σ)"      value={ctrlHufM(T.actualTotal - T.planTotal) + ' M'}
          sub={T.actualTotal > T.planTotal ? 'Terv felett' : 'Megtakarítás'}
          tone={T.actualTotal > T.planTotal ? 'rose' : 'emerald'} />
      </div>

      {/* Portfolio table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-4">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <span className="text-[12.5px] font-semibold text-stone-800">Projekt-portfólió</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] min-w-[700px]">
            <thead>
              <tr className="bg-stone-50/60 border-b border-stone-100 text-[10.5px] text-stone-400">
                <th className="text-left px-4 py-2">Projekt</th>
                <th className="text-right px-3 py-2">Érték</th>
                <th className="text-right px-3 py-2">Terv-ktg</th>
                <th className="text-right px-3 py-2">Tény-ktg</th>
                <th className="text-left px-3 py-2">Fedezet</th>
                <th className="text-right px-3 py-2">Eltérés</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {pf.rows.map((r) => (
                <tr key={r.project.id}
                  className="hover:bg-stone-50/60 cursor-pointer"
                  onClick={() => setOpenCalc(r)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-900 truncate max-w-[200px]">{r.project.name}</div>
                    <div className="text-[10.5px] text-stone-400 truncate">{r.project.customer}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-stone-700 whitespace-nowrap">{ctrlHufM(r.project.contractValue)} M</td>
                  <td className="px-3 py-3 text-right tabular-nums text-stone-600 whitespace-nowrap">{ctrlHufM(r.planTotal)} M</td>
                  <td className="px-3 py-3 text-right tabular-nums text-stone-800 font-medium whitespace-nowrap">{ctrlHufM(r.actualTotal)} M</td>
                  <td className="px-3 py-3">
                    <MarginPill pct={r.actualMarginPct} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <VarPill diff={r.variance} />
                  </td>
                  <td className="px-3 py-3">
                    <Icon name="chevron" size={14} className="text-stone-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* top / flop */}
      <div className="grid md:grid-cols-2 gap-3">
        {([['Legjobb fedezet', pf.top], ['Leggyengébb fedezet', pf.flop]] as const).map(([label, r]) =>
          r ? (
            <button key={label} onClick={() => setOpenCalc(r)}
              className="text-left bg-white rounded-2xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-sm transition">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-400 font-medium mb-1.5">{label}</div>
              <div className="text-[14px] font-semibold text-stone-900 mb-0.5">{r.project.name}</div>
              <div className="text-[11px] text-stone-400 mb-2">{r.project.customer}</div>
              <MarginBar revenue={r.project.contractValue} cost={r.actualTotal} />
              <div className="flex items-center justify-between mt-2">
                <MarginPill pct={r.actualMarginPct} />
                <span className="text-[10.5px] text-stone-400">{ctrlHuf(r.project.contractValue)}</span>
              </div>
            </button>
          ) : null
        )}
      </div>

      <ProjectDetailSlideOver calc={openCalc} onClose={() => setOpenCalc(null)} />
    </div>
  )
}

// ── Project List ───────────────────────────────────────────────────────────────
function CtrlProjectList() {
  const [openCalc, setOpenCalc] = useState<CtrlProjectCalc | null>(null)
  const rows = CTRL_PROJECTS.map(calcProject)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Projekt-fedezet</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Kategóriánkénti terv vs. tény bontás</p>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <button key={r.project.id} onClick={() => setOpenCalc(r)}
            className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3 hover:shadow-sm hover:border-stone-300 transition flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[13px] font-semibold text-stone-900">{r.project.name}</span>
                <ProjectStatusPill status={r.project.status} />
              </div>
              <div className="text-[11.5px] text-stone-500 mb-2">{r.project.customer} · {ctrlHuf(r.project.contractValue)}</div>
              <MarginBar revenue={r.project.contractValue} cost={r.actualTotal} />
            </div>
            <div className="shrink-0 text-right">
              <MarginPill pct={r.actualMarginPct} />
              <div className="mt-1.5">
                <VarPill diff={r.variance} />
              </div>
            </div>
            <Icon name="chevron" size={14} className="text-stone-300 shrink-0" />
          </button>
        ))}
      </div>
      <ProjectDetailSlideOver calc={openCalc} onClose={() => setOpenCalc(null)} />
    </div>
  )
}

// ── World Page ─────────────────────────────────────────────────────────────────
export function ControllingWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'projects') return <CtrlProjectList />
    return <ControllingDashboard />
  }

  return (
    <WorldShell worldKey="kontrolling" screen={currentScreen}
      onScreen={(key) => navigate(`/w/kontrolling/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  EXEC_TREND_DATA, EXEC_TOP5_PROJECTS, EXEC_TOP5_CUSTOMERS, EXEC_TAB_META,
  type ExecTab,
} from '../mocks/execbi'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return Math.round(n).toLocaleString('hu-HU') + ' Ft'
}

function fmtM(n: number): string {
  return (n / 1e6).toFixed(1) + ' M Ft'
}

// ── Trend Detail SlideOver ─────────────────────────────────────────────────
function TrendDetailSlideOver({ metric, onClose }: { metric: string; onClose: () => void }) {
  const last6 = EXEC_TREND_DATA.slice(-6)
  return (
    <SlideOver open={true} onClose={onClose} title={metric} subtitle="Trend részlet" width={480}>
      <div className="space-y-3 px-5 py-5">
        <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium mb-3">Utolsó 6 hónap</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-stone-400 text-[10.5px] border-b border-stone-100">
              <th className="text-left pb-2">Hónap</th>
              <th className="text-right pb-2">Árbevétel</th>
              <th className="text-right pb-2">Fedezet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {last6.map((pt) => (
              <tr key={pt.ym}>
                <td className="py-1.5 text-stone-700 font-mono">{pt.ym}</td>
                <td className="py-1.5 text-right text-stone-800">{pt.revenue.toFixed(1)} M Ft</td>
                <td className="py-1.5 text-right text-stone-600">{Math.round(pt.margin * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideOver>
  )
}

// ── Finance Tab ────────────────────────────────────────────────────────────
function FinanceTab({ onTrend }: { onTrend: (m: string) => void }) {
  const last = EXEC_TREND_DATA[EXEC_TREND_DATA.length - 1]
  const last6 = EXEC_TREND_DATA.slice(-6)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="text-[22px] font-semibold text-teal-700 leading-none">{last.revenue.toFixed(1)} M Ft</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">Havi árbevétel</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">2026-04</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="text-[22px] font-semibold text-indigo-700 leading-none">{Math.round(last.margin * 100)}%</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">Fedezet</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">tény fedezeti hányad</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="text-[22px] font-semibold text-sky-700 leading-none">{last.backlog.toFixed(1)} M Ft</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">Backlog</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">rendelésállomány</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Top 5 ügyfél (YTD)</span>
          </div>
          <div className="divide-y divide-stone-50">
            {EXEC_TOP5_CUSTOMERS.map((c, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                <div className="text-[12px] text-stone-800">{c.name}</div>
                <div className="text-[12px] font-mono text-stone-700">{fmtM(c.ytd)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-stone-800">Árbevétel trend (6 hó)</span>
            <button onClick={() => onTrend('Árbevétel')} className="text-[11px] text-teal-600 hover:text-teal-800">
              Részletek →
            </button>
          </div>
          <div className="divide-y divide-stone-50">
            {last6.map((pt) => (
              <div key={pt.ym} className="px-4 py-2.5 flex items-center justify-between">
                <div className="text-[11px] text-stone-500 font-mono">{pt.ym}</div>
                <div className="text-[12px] font-semibold text-stone-800">{pt.revenue.toFixed(1)} M Ft</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Production Tab ─────────────────────────────────────────────────────────
function ProductionTab() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Aktív gép',        value: '6',   sub: 'üzemelő gép',          tone: 'emerald' },
        { label: 'Átl. kihasználtság', value: '87%', sub: 'gépi terhelés',        tone: 'teal' },
        { label: 'Nyitott jegy',     value: '3',   sub: 'karbantartási jegy',    tone: 'amber' },
        { label: 'Balesetmentes nap', value: '45',  sub: 'EHS napszámláló',       tone: 'sky' },
      ].map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className={`text-[22px] font-semibold text-${kpi.tone}-700 leading-none`}>{kpi.value}</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">{kpi.label}</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── Sales Tab ──────────────────────────────────────────────────────────────
function SalesTab() {
  const last = EXEC_TREND_DATA[EXEC_TREND_DATA.length - 1]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="text-[22px] font-semibold text-violet-700 leading-none">{last.pipeline.toFixed(1)} M Ft</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">Pipeline</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">súlyozott forecast</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="text-[22px] font-semibold text-indigo-700 leading-none">5</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">Aktív projekt</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">folyamatban lévő</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <span className="text-[12.5px] font-semibold text-stone-800">Top 5 projekt</span>
        </div>
        <div className="divide-y divide-stone-50">
          {EXEC_TOP5_PROJECTS.map((p, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center justify-between">
              <div className="text-[12px] text-stone-800">{p.name}</div>
              <div className="flex items-center gap-3">
                <div className="text-[12px] font-mono text-stone-700">{fmtM(p.revenue)}</div>
                <div className="text-[11px] text-emerald-700">{Math.round(p.margin * 100)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── HR Tab ─────────────────────────────────────────────────────────────────
function HrTab() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Headcount',   value: '8', sub: 'teljes állomány',      tone: 'stone' },
        { label: 'Ma jelen',    value: '5', sub: 'bejelentkezett',        tone: 'emerald' },
        { label: 'Késő',        value: '1', sub: 'késett belépés',         tone: 'amber' },
        { label: 'Hiányzó',     value: '1', sub: 'engedéllyel / beteg',   tone: 'rose' },
      ].map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className={`text-[22px] font-semibold text-${kpi.tone}-700 leading-none`}>{kpi.value}</div>
          <div className="text-[12px] font-medium text-stone-700 mt-2">{kpi.label}</div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── ExecBI Dashboard ────────────────────────────────────────────────────────
function ExecBiDashboard() {
  const [activeTab, setActiveTab] = useState<ExecTab>('finance')
  const [trendMetric, setTrendMetric] = useState<string | null>(null)

  const tabs: ExecTab[] = ['finance', 'production', 'sales', 'hr']

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Vezetői BI</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Kereszt-világ KPI cockpit</p>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1 mb-5 bg-stone-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-[12.5px] font-medium transition ${
              activeTab === tab
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {EXEC_TAB_META[tab].label}
          </button>
        ))}
      </div>

      {activeTab === 'finance'    && <FinanceTab onTrend={setTrendMetric} />}
      {activeTab === 'production' && <ProductionTab />}
      {activeTab === 'sales'      && <SalesTab />}
      {activeTab === 'hr'         && <HrTab />}

      {trendMetric && (
        <TrendDetailSlideOver metric={trendMetric} onClose={() => setTrendMetric(null)} />
      )}
    </div>
  )
}

// ── ExecBI World Page ──────────────────────────────────────────────────────
export function ExecBiWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    return <ExecBiDashboard />
  }

  return (
    <WorldShell
      worldKey="execbi"
      screen={currentScreen}
      onScreen={(key) => navigate(`/w/execbi/${key}`)}
      onHome={() => navigate('/')}
    >
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

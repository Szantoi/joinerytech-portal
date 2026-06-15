import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon } from '../components/ui'
import { SlideOver } from '../components/ui/SlideOver'
import { WorldShell } from '../components/layout/WorldShell'
import {
  PROJECTS, PROJECT_STATUS_META, TRADE_META, DEP_STATUS_META,
  type Project, type ProjectStatus,
} from '../mocks/projects'

// ── Helpers ────────────────────────────────────────────────────────────────
function projTotal(p: Project): number {
  return p.items.reduce((s, i) => s + i.value, 0)
}
function projHuf(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '') + ' M Ft'
  if (Math.abs(n) >= 1_000)    return Math.round(n / 1_000) + ' eFt'
  return n + ' Ft'
}
function installReady(p: Project): boolean {
  return p.dependencies.filter((d) => d.blocksInstall).every((d) => d.status === 'done')
}
function installRisk(p: Project): boolean {
  return p.dependencies.some((d) => d.blocksInstall && d.status === 'blocked')
}

// ── Status Pill ────────────────────────────────────────────────────────────
function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const m = PROJECT_STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${m.bg} ${m.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  )
}

// ── Project Detail SlideOver ───────────────────────────────────────────────
function ProjectDetailSlideOver({ project, onClose }: { project: Project | null; onClose: () => void }) {
  if (!project) return null
  const p = project
  const total = projTotal(p)
  const ready = installReady(p)
  const risk = installRisk(p)
  const blockedDeps = p.dependencies.filter((d) => d.blocksInstall && d.status !== 'done').length

  return (
    <SlideOver open={true} onClose={onClose} title={p.name} subtitle={`${p.id} · ${p.customer} · ${p.designer}`} width={520}>
      <div className="space-y-5 px-5 py-5">
        {/* Header info */}
        <div className="flex items-center gap-3 flex-wrap">
          <ProjectStatusPill status={p.status} />
          <span className="text-[11.5px] text-stone-500 inline-flex items-center gap-1">
            <Icon name="calendar" size={13} />Beépítés: <span className="font-mono ml-1">{p.installTarget}</span>
          </span>
          <span className="text-[11.5px] text-stone-500">Fedezet: <span className="font-semibold text-stone-800">{Math.round(p.margin * 100)}%</span></span>
        </div>

        {/* Install readiness */}
        {p.status !== 'done' && (
          <div className={`rounded-lg px-3 py-2.5 flex items-center gap-2 ${ready ? 'bg-emerald-50' : risk ? 'bg-rose-50' : 'bg-amber-50'}`}>
            <Icon name={ready ? 'check' : risk ? 'alert' : 'wrench'} size={15} className={ready ? 'text-emerald-600' : risk ? 'text-rose-600' : 'text-amber-600'} />
            <span className={`text-[12px] font-medium ${ready ? 'text-emerald-700' : risk ? 'text-rose-700' : 'text-amber-700'}`}>
              {ready ? 'Beépítés indítható' : risk ? 'Csúszás kockázat — blokkolt szakág' : `${blockedDeps} szakág még hátravan`}
            </span>
          </div>
        )}

        {/* Szakágak */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Szakágak</div>
          <div className="space-y-1.5">
            {p.dependencies.map((d) => {
              const tm = TRADE_META[d.trade]
              const dm = DEP_STATUS_META[d.status]
              return (
                <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-100">
                  <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[10.5px] font-medium ${tm.tint}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tm.dot}`} />{tm.label}
                  </span>
                  <span className="flex-1 text-[11.5px] text-stone-600 truncate">{d.label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium border ${dm.tone}`}>
                    <span className={`w-1 h-1 rounded-full ${dm.dot}`} />{dm.label}
                  </span>
                  {d.blocksInstall && (
                    <span className="text-[9.5px] text-rose-500 border border-rose-200 bg-rose-50 px-1.5 py-0.5 rounded-full font-medium">blokkolja</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tételek */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Tételek</div>
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            {p.items.map((item, i) => (
              <div key={item.id} className={`flex items-center justify-between px-3 py-2.5 text-[12px] ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                <span className="text-stone-700 flex-1 truncate">{item.name}</span>
                <span className="text-[11px] text-stone-500 mr-3">{item.qty} db</span>
                <span className="font-semibold tabular-nums text-stone-800">{projHuf(item.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-stone-200 bg-stone-50/50">
              <span className="text-[12.5px] font-semibold text-stone-800">Összesen</span>
              <span className="text-[14px] font-bold tabular-nums text-stone-900">{projHuf(total)}</span>
            </div>
          </div>
        </div>

        {p.note && (
          <div className="text-[11.5px] text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">{p.note}</div>
        )}
      </div>
    </SlideOver>
  )
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const tone = PROJECT_STATUS_META[p.status]
  const total = projTotal(p)
  const ready = installReady(p)
  const risk = installRisk(p)
  const blockedDeps = p.dependencies.filter((d) => d.blocksInstall && d.status !== 'done').length

  return (
    <button onClick={onOpen} className="text-left bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md hover:border-stone-300 transition w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-stone-900 leading-tight">{p.name}</div>
          <div className="text-[11.5px] text-stone-500 mt-0.5">{p.customer} · {p.designer}</div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[10.5px] font-medium ${tone.bg} ${tone.fg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />{tone.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {p.status === 'done' ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
            <Icon name="check" size={13} /> Lezárva
          </span>
        ) : ready ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
            <Icon name="check" size={13} /> Beépítés indítható
          </span>
        ) : risk ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
            <Icon name="alert" size={13} /> Csúszás kockázat
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
            <Icon name="wrench" size={13} /> {blockedDeps} szakág hátravan
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {p.dependencies.map((d) => {
          const tm = TRADE_META[d.trade]
          return (
            <span key={d.id} className={`inline-flex items-center gap-1 px-1.5 h-6 rounded-md text-[10px] font-medium ${tm.tint}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${DEP_STATUS_META[d.status].dot}`} />
            </span>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11.5px]">
        <span className="text-stone-500">{p.items.length} tétel · <span className="font-mono">{p.installTarget}</span></span>
        <span className="font-semibold text-stone-800 tabular-nums">{projHuf(total)}</span>
      </div>
    </button>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function ProjectDashboard({ onScreen }: { onScreen: (s: string) => void }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const active = PROJECTS.filter((p) => p.status === 'active' || p.status === 'install')
  const overdue = PROJECTS.filter((p) =>
    p.status !== 'done' && p.status !== 'draft' && p.installTarget < '2026-04-28'
  )
  const avgMargin = PROJECTS.length > 0
    ? Math.round(PROJECTS.reduce((s, p) => s + p.margin, 0) / PROJECTS.length * 100)
    : 0

  const KpiCard = ({ label, value, sub, tone, icon }: { label: string; value: string | number; sub: string; tone: string; icon: string }) => (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg grid place-items-center bg-${tone}-50 text-${tone}-600`}>
          <Icon name={icon} size={16} />
        </div>
        <div className="text-[22px] font-semibold text-stone-900 leading-none">{value}</div>
      </div>
      <div className="text-[12px] font-medium text-stone-700 mt-2.5">{label}</div>
      <div className="text-[10.5px] text-stone-400 mt-0.5">{sub}</div>
    </div>
  )

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Projektek</h1>
          <p className="text-[12.5px] text-stone-500 mt-0.5">Bútor-tételek és szakág-koordináció</p>
        </div>
        <button onClick={() => onScreen('list')} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-medium shrink-0">
          <Icon name="folder" size={15} />Összes projekt
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Aktív projektek" value={active.length} sub="folyamatban + beépítésre kész" tone="violet" icon="folder" />
        <KpiCard label="Lejárt határidő" value={overdue.length} sub="installTarget a múltban" tone="rose" icon="alert" />
        <KpiCard label="Átlagos fedezet" value={`${avgMargin}%`} sub="összes projekt átlaga" tone="emerald" icon="analytics" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {active.slice(0, 4).map((p) => (
          <ProjectCard key={p.id} p={p} onOpen={() => setSelectedProject(p)} />
        ))}
      </div>

      <ProjectDetailSlideOver project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  )
}

// ── Project List ───────────────────────────────────────────────────────────
function ProjectList() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const STATUS_FILTERS: Array<{ k: ProjectStatus | 'all'; l: string }> = [
    { k: 'all', l: 'Összes' },
    { k: 'draft', l: 'Vázlat' },
    { k: 'active', l: 'Folyamatban' },
    { k: 'install', l: 'Beépítésre kész' },
    { k: 'done', l: 'Lezárva' },
    { k: 'on_hold', l: 'Felfüggesztve' },
  ]

  const rows = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.status === filter)

  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Projektlista</h1>
      </div>

      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium border ${filter === f.k ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((p) => (
          <ProjectCard key={p.id} p={p} onOpen={() => setSelectedProject(p)} />
        ))}
        {rows.length === 0 && (
          <div className="md:col-span-2 py-12 text-center text-[13px] text-stone-400">Nincs projekt ebben a szűrőben.</div>
        )}
      </div>

      <ProjectDetailSlideOver project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  )
}

// ── Kanban Board ───────────────────────────────────────────────────────────
function ProjectKanban() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const COLUMNS: Array<{ key: ProjectStatus; label: string }> = [
    { key: 'draft', label: 'Tervezett' },
    { key: 'active', label: 'Aktív' },
    { key: 'install', label: 'Beépítésre kész' },
    { key: 'done', label: 'Lezárva' },
  ]

  return (
    <div className="px-4 md:px-7 py-5 md:py-6">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Kanban</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start">
        {COLUMNS.map((col) => {
          const colProjects = PROJECTS.filter((p) => p.status === col.key)
          const m = PROJECT_STATUS_META[col.key]
          return (
            <div key={col.key} className="bg-stone-50/70 rounded-xl border border-stone-200 p-3">
              <div className={`flex items-center gap-2 mb-3`}>
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <span className="text-[12px] font-semibold text-stone-700">{col.label}</span>
                <span className="ml-auto text-[11px] text-stone-400">{colProjects.length}</span>
              </div>
              <div className="space-y-2">
                {colProjects.map((p) => (
                  <button key={p.id} onClick={() => setSelectedProject(p)}
                    className="w-full text-left bg-white rounded-lg border border-stone-200 p-2.5 hover:shadow-sm hover:border-violet-200 transition">
                    <div className="text-[12px] font-semibold text-stone-800 leading-tight truncate">{p.name}</div>
                    <div className="text-[10.5px] text-stone-500 mt-0.5 truncate">{p.customer}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400">
                      <span className="font-mono">{p.installTarget}</span>
                      <span className="tabular-nums font-medium text-stone-600">{projHuf(projTotal(p))}</span>
                    </div>
                  </button>
                ))}
                {colProjects.length === 0 && (
                  <div className="py-4 text-center text-[11px] text-stone-400">Üres</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ProjectDetailSlideOver project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  )
}

// ── Projects World Page ────────────────────────────────────────────────────
export function ProjectsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'list')   return <ProjectList />
    if (currentScreen === 'kanban') return <ProjectKanban />
    return <ProjectDashboard onScreen={(s) => navigate(`/w/projects/${s}`)} />
  }

  return (
    <WorldShell worldKey="projects" screen={currentScreen}
      onScreen={(key) => navigate(`/w/projects/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

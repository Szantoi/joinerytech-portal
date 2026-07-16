import { useState } from 'react'
import { Card, PrimaryBtn } from '../components/ui'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { MachineParkPanel } from '../components/settings/MachineParkPanel'
import { CatalogPanel } from '../components/settings/CatalogPanel'
import { AuditPanel } from '../components/settings/AuditPanel'
import { FacilitiesPanel } from '../components/settings/FacilitiesPanel'
import { PartnersPanel } from '../components/settings/PartnersPanel'
import { RolesPanel } from '../components/settings/RolesPanel'
import { StageChainEditor } from '../components/settings/StageChainEditor'
import { UsersPanel } from '../components/settings/UsersPanel'
import { TemplatesPanel } from '../components/settings/TemplatesPanel'
import { AuthorityPanel } from '../components/settings/AuthorityPanel'
import { ProcessesPanel } from '../components/settings/ProcessesPanel'
type SettingsTab = 'company' | 'appearance' | 'users' | 'facilities' | 'machines' | 'partners' | 'workflow' | 'processes' | 'integrations' | 'catalog' | 'audit' | 'roles' | 'templates' | 'authority'

const TAB_LIST: Array<{ key: SettingsTab; label: string }> = [
  { key: 'company',      label: 'Cég' },
  { key: 'appearance',   label: 'Megjelenés' },
  { key: 'users',        label: 'Felhasználók' },
  { key: 'roles',        label: 'Jogosultságok' },
  { key: 'authority',    label: 'Hatáskörök' },
  { key: 'facilities',   label: 'Telephely' },
  { key: 'machines',     label: 'Géppark' },
  { key: 'partners',     label: 'Partnerek' },
  { key: 'workflow',     label: 'Munkafolyamat' },
  { key: 'processes',    label: 'Folyamatok' },
  { key: 'integrations', label: 'Integrációk' },
  { key: 'catalog',      label: 'Katalógus' },
  { key: 'templates',    label: 'Sablonok' },
  { key: 'audit',        label: 'Audit napló' },
]

interface SettingsPageProps {
  initialTab?: string
  onTabChange?: (tab: string) => void
}

export function SettingsPage({ initialTab = 'company', onTabChange }: SettingsPageProps = {}) {
  const [tab, setTab] = useState<SettingsTab>((initialTab as SettingsTab) ?? 'company')

  function handleTabChange(newTab: SettingsTab) {
    setTab(newTab)
    onTabChange?.(newTab)
  }

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 mb-5 border-b border-line/80 overflow-x-auto">
        {TAB_LIST.map((tb) => (
          <button
            key={tb.key}
            onClick={() => handleTabChange(tb.key)}
            className={`px-3 h-9 text-[12.5px] font-medium border-b-2 whitespace-nowrap transition ${
              tab === tb.key
                ? 'border-teal-600 dark:border-teal-400 text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'company' && <CompanyTab />}
      {tab === 'appearance' && <AppearanceTab />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'roles' && (
        <>
          <EndpointPending endpoint="GET /api/roles [?]" />
          <RolesPanel />
        </>
      )}
      {tab === 'facilities' && <FacilitiesPanel />}
      {tab === 'machines' && <MachineParkPanel />}
      {tab === 'partners' && (
        <>
          <EndpointPending endpoint="GET /api/partners [?]" />
          <PartnersPanel />
        </>
      )}
      {tab === 'audit' && <AuditPanel />}
      {tab === 'catalog' && <CatalogPanel />}
      {tab === 'workflow' && (
        <>
          <EndpointPending endpoint="GET /api/workflow/stages [?]" />
          <StageChainEditor />
        </>
      )}
      {tab === 'processes' && <ProcessesPanel />}
      {tab === 'templates' && <TemplatesPanel />}
      {tab === 'authority' && <AuthorityPanel />}
      {tab === 'integrations' && (
        <Card className="p-8 text-center">
          <div className="text-[13px] font-medium text-ink">Integrációk</div>
          <div className="text-[11.5px] text-ink-soft mt-1">Tartalom placeholder — ehhez a fülhöz design-folyamat van.</div>
        </Card>
      )}
    </div>
  )
}

function EndpointPending({ endpoint }: { endpoint: string }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/40 px-6 py-4 flex flex-col items-start gap-1">
      <div className="text-[13px] font-semibold text-amber-700 dark:text-amber-300">Backend endpoint nem elérhető</div>
      <code className="text-[11px] text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 rounded px-2 py-0.5">{endpoint}</code>
      <div className="text-[11px] text-ink-soft">Az endpoint implementálása után lesz élő adat</div>
    </div>
  )
}


/**
 * Megjelenés — téma-választó (design-system/dark-mode.html "Bevezetés"):
 * rendszer / világos / sötét, localStorage-ben perzisztálva (jt-theme).
 * Ugyanaz a ThemeToggle, mint a felhasználói menüben és a mobil drawerben.
 */
function AppearanceTab() {
  return (
    <Card className="p-5 max-w-[640px]">
      <div className="text-[13px] font-semibold text-ink">Téma</div>
      <p className="text-[11.5px] text-ink-muted mt-1 mb-4">
        A „rendszer&rdquo; a készülék beállítását követi; a választás ezen a böngészőn megmarad.
      </p>
      <div className="max-w-[320px]">
        <ThemeToggle />
      </div>
    </Card>
  )
}

function CompanyTab() {
  return (
    <Card className="p-5">
      <div className="grid grid-cols-2 gap-4 max-w-[640px]">
        {[
          { label: 'Cégnév',    value: 'Doorstar Hungary Zrt.' },
          { label: 'Adószám',   value: '12345678-2-13' },
          { label: 'Cím',       value: '2600 Vác, Ipari park 14.' },
          { label: 'Bank',      value: 'OTP · 11774012-12345678' },
          { label: 'Kapcsolat', value: 'info@doorstar.hu' },
          { label: 'Telefon',   value: '+36 27 123 456' },
        ].map((f, i) => (
          <div key={i}>
            <div className="text-[10.5px] uppercase tracking-wide text-ink-soft mb-1">{f.label}</div>
            <input
              defaultValue={f.value}
              className="w-full h-9 px-3 rounded-lg border border-line bg-surface-card text-ink text-[12.5px] focus:outline-none focus:ring-2 focus:ring-world-ring/30"
            />
          </div>
        ))}
      </div>
      <div className="mt-5">
        <PrimaryBtn>Mentés</PrimaryBtn>
      </div>
    </Card>
  )
}


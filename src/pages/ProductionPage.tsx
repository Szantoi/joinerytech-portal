import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import {
  ProductionDashboard,
  CuttingPlansScreen,
  CuttingExecutionScreen,
  DoorOrdersScreen,
  QuotesScreen,
  CuttingAnalyticsScreen,
} from '../modules/production'
import { WorkflowPage } from './WorkflowPage'

/**
 * Production világ-oldal — vékony képernyő-diszpécser (MODULE-FOLDERS
 * precedens, CrmPage/EhsPage mintája). A képernyők a ./production/ modul
 * alatt élnek (adatréteg: services/production, API-first cutting+joinery
 * kontraktus-tükör — WORLDS-PRODUCTION-FE, docs/knowledge/architecture/
 * WORLDS_API_CONTRACTS_2026-07-18.md).
 *
 * A `cutting` route-kulcs VÁLTOZATLAN (legacy integráció megőrzése): a Design
 * világ anyaglista-generálása `navigate('/w/production/cutting', {state:
 * {highlightPlanId}})`-vel ide navigál — a CuttingPlansScreen kezeli a
 * highlight-state-et (ld. a képernyő fejléc-kommentjét).
 *
 * A `workflow` képernyő KIVÉTEL a modul alól: a kernel flow-epic adatokon
 * dolgozik (nem cutting/joinery — kontraktus-doksi P5 gap, kernel-scope),
 * ezért változatlanul a legacy WorkflowPage-et rendereli.
 */
export function ProductionWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'cutting') return <CuttingPlansScreen />
    if (currentScreen === 'machining') return <CuttingExecutionScreen />
    if (currentScreen === 'orders') return <DoorOrdersScreen />
    if (currentScreen === 'quotes') return <QuotesScreen />
    if (currentScreen === 'workflow') return <WorkflowPage />
    if (currentScreen === 'analytics') return <CuttingAnalyticsScreen />
    return <ProductionDashboard onScreen={(s) => navigate(`/w/production/${s}`)} />
  }

  return (
    <WorldShell worldKey="production" screen={currentScreen}
      onScreen={(key) => navigate(`/w/production/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import {
  DashboardScreen,
  PortfolioScreen,
  MarginScreen,
  VarianceScreen,
  AdjustmentsScreen,
} from '../modules/controlling'

/**
 * Kontrolling világ-oldal — vékony képernyő-diszpécser (a képernyők a
 * ./controlling/ alatt élnek, adatréteg: services/controlling + MSW
 * kontraktus-tükör: mocks/controllingApi).
 * F2-KONTROLLING-FE: a korábbi statikus-mock oldal átdolgozva az EHS/CRM
 * adatréteg-mintára; a projekt-státusz életciklus-címke, nem szigorú FSM.
 */
export function ControllingWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'portfolio') return <PortfolioScreen />
    if (currentScreen === 'projects') return <MarginScreen />
    if (currentScreen === 'variance') return <VarianceScreen />
    if (currentScreen === 'adjustments') return <AdjustmentsScreen />
    return <DashboardScreen onScreen={(s) => navigate(`/w/kontrolling/${s}`)} />
  }

  return (
    <WorldShell worldKey="kontrolling" screen={currentScreen}
      onScreen={(key) => navigate(`/w/kontrolling/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

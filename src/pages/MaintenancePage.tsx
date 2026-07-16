import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import {
  MaintenanceDashboard,
  AssetsScreen,
  WorkOrdersScreen,
  ScheduleScreen,
} from '../modules/maintenance'

/**
 * Karbantartás világ-oldal — vékony képernyő-diszpécser (a képernyők a
 * ./maintenance/ alatt élnek, adatréteg: services/maintenance + MSW
 * kontraktus-tükör: mocks/maintenanceApi). F2-MAINTENANCE-FE: a korábbi
 * statikus-mock oldal átdolgozva az EHS/CRM/HR adatréteg-mintára; a munkalap
 * szigorú FSM (services/maintenance/fsm.ts), az eszköz-státusz SZÁMÍTOTT.
 */
export function MaintenanceWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'assets') return <AssetsScreen />
    if (currentScreen === 'workorders') return <WorkOrdersScreen />
    if (currentScreen === 'schedule') return <ScheduleScreen />
    return <MaintenanceDashboard onScreen={(s) => navigate(`/w/maintenance/${s}`)} />
  }

  return (
    <WorldShell worldKey="maintenance" screen={currentScreen}
      onScreen={(key) => navigate(`/w/maintenance/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

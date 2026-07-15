import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import { CrmDashboard } from './crm/CrmDashboard'
import { PipelineScreen } from './crm/PipelineScreen'
import { LeadsScreen } from './crm/LeadsScreen'
import { OppsScreen } from './crm/OppsScreen'
import { TasksScreen } from './crm/TasksScreen'
import { ForecastScreen } from './crm/ForecastScreen'

/**
 * CRM világ-oldal — vékony képernyő-diszpécser (a képernyők a ./crm/ alatt
 * élnek, adatréteg: services/crm + MSW kontraktus-tükör: mocks/crmApi).
 * F2-CRM-FE: a korábbi statikus-mock oldal átdolgozva az EHS adatréteg-mintára.
 */
export function CrmWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'pipeline') return <PipelineScreen />
    if (currentScreen === 'leads') return <LeadsScreen />
    if (currentScreen === 'opps') return <OppsScreen />
    if (currentScreen === 'tasks') return <TasksScreen />
    if (currentScreen === 'forecast') return <ForecastScreen />
    return <CrmDashboard onScreen={(s) => navigate(`/w/crm/${s}`)} />
  }

  return (
    <WorldShell worldKey="crm" screen={currentScreen}
      onScreen={(key) => navigate(`/w/crm/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

export { CrmWorldPage as CrmPage }

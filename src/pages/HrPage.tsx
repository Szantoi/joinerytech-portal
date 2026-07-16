import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import {
  HrDashboard,
  PeopleScreen,
  CapacityScreen,
  AbsencesScreen,
  SkillsScreen,
  TimeLogsScreen,
} from '../modules/hr'

/**
 * HR világ-oldal — vékony képernyő-diszpécser (a képernyők a ./hr/ alatt
 * élnek, adatréteg: services/hr + MSW kontraktus-tükör: mocks/hrApi).
 * F2-HR-FE: a korábbi statikus-mock oldal átdolgozva az EHS/CRM/Kontrolling
 * adatréteg-mintára; a távollét szigorú FSM (services/hr/fsm.ts).
 */
export function HrWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'people') return <PeopleScreen />
    if (currentScreen === 'capacity') return <CapacityScreen />
    if (currentScreen === 'absences') return <AbsencesScreen />
    if (currentScreen === 'skills') return <SkillsScreen />
    if (currentScreen === 'timelogs') return <TimeLogsScreen />
    return <HrDashboard onScreen={(s) => navigate(`/w/hr/${s}`)} />
  }

  return (
    <WorldShell worldKey="hr" screen={currentScreen}
      onScreen={(key) => navigate(`/w/hr/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

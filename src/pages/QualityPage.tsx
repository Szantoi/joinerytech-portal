import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import { QaDashboard } from './qa/QaDashboard'
import { InspectionsScreen } from './qa/InspectionsScreen'
import { TicketsScreen } from './qa/TicketsScreen'
import { TrendScreen } from './qa/TrendScreen'

/**
 * Minőség (QA) világ-oldal — vékony képernyő-diszpécser (a képernyők a ./qa/
 * alatt élnek, adatréteg: services/qa + MSW kontraktus-tükör: mocks/qaApi).
 * F2-QA-FE: a korábbi üres (EndpointPending) oldal átdolgozva az EHS/CRM/HR/
 * Maintenance adatréteg-mintára; az átvizsgálás és a hibajegy szigorú FSM-en
 * fut (services/qa/fsm.ts — a backend src/qa aggregátumok tükre), a
 * blocking/openTickets mezők SZÁMÍTOTTAK. Világ-kulcs: `quality` (route:
 * /w/quality), akcent: [data-world='qa'] = lime (worldAccents.ts képezi le).
 */
export function QualityWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'inspections') return <InspectionsScreen />
    if (currentScreen === 'tickets') return <TicketsScreen />
    if (currentScreen === 'trend') return <TrendScreen />
    return <QaDashboard onScreen={(s) => navigate(`/w/quality/${s}`)} />
  }

  return (
    <WorldShell worldKey="quality" screen={currentScreen}
      onScreen={(key) => navigate(`/w/quality/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

import { useNavigate, useParams } from 'react-router-dom'
import { WorldShell } from '../components/layout/WorldShell'
import { DmsDashboard, LibraryScreen, ExpiringScreen } from '../modules/dms'

/**
 * Dokumentumtár (DMS) világ-oldal — vékony képernyő-diszpécser (a képernyők a
 * ./dms/ alatt élnek, adatréteg: services/dms + MSW kontraktus-tükör:
 * mocks/dmsApi). F2-DMS-FE: a korábbi statikus-mock oldal átdolgozva az
 * érett adatréteg-mintára (7., utolsó modul); a dokumentum szigorú
 * jóváhagyás-FSM-en fut (services/dms/fsm.ts — a prototípus DOC_FLOW tükre,
 * a backendben nincs futtatható Document-endpoint: MSW-first kontraktus), a
 * releasedVersion/expiry mezők SZÁMÍTOTTAK. Világ-kulcs: `docs` (route:
 * /w/docs), akcent: [data-world='dms'] = violet (worldAccents.ts képezi le).
 */
export function DocsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'

  function renderContent() {
    if (currentScreen === 'library') return <LibraryScreen />
    if (currentScreen === 'expiring') return <ExpiringScreen />
    return <DmsDashboard onScreen={(s) => navigate(`/w/docs/${s}`)} />
  }

  return (
    <WorldShell worldKey="docs" screen={currentScreen}
      onScreen={(key) => navigate(`/w/docs/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
    </WorldShell>
  )
}

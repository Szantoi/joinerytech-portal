import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { WorldShell } from '../components/layout/WorldShell'
import { useToast } from '../components/ui'
import { IncidentReportFAB } from '../components/EHS/IncidentReportFAB'
import { ehsKeys } from '../services/ehs'
import { EhsDashboard } from './ehs/EhsDashboard'
import { IncidentsScreen } from './ehs/IncidentsScreen'
import { RisksScreen } from './ehs/RisksScreen'
import { SdsScreen } from './ehs/SdsScreen'
import { PpeScreen } from './ehs/PpeScreen'
import { WalksScreen } from './ehs/WalksScreen'

/**
 * EHS világ-oldal — vékony képernyő-diszpécser (a képernyők a ./ehs/ alatt élnek,
 * adatréteg: services/ehs). A gyorsbejelentő FAB world-szinten mountolt (task 2):
 * sikeres beküldés → toast + esemény-lista invalidálás.
 */
export function EhsWorldPage() {
  const navigate = useNavigate()
  const { screen } = useParams<{ screen?: string }>()
  const currentScreen = screen ?? 'dash'
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  function renderContent() {
    if (currentScreen === 'incidents') return <IncidentsScreen />
    if (currentScreen === 'risks') return <RisksScreen />
    if (currentScreen === 'sds') return <SdsScreen />
    if (currentScreen === 'ppe') return <PpeScreen />
    if (currentScreen === 'walks') return <WalksScreen />
    // visszafelé kompatibilitás: a régi "Intézkedések" képernyő → egységes CAPA-tábla fül
    if (currentScreen === 'actions') return <WalksScreen initialTab="capa" />
    return <EhsDashboard onScreen={(s) => navigate(`/w/ehs/${s}`)} />
  }

  return (
    <WorldShell worldKey="ehs" screen={currentScreen}
      onScreen={(key) => navigate(`/w/ehs/${key}`)}
      onHome={() => navigate('/')}>
      <div key={currentScreen} className="contents">{renderContent()}</div>
      <IncidentReportFAB
        onSuccess={() => {
          addToast('Bejelentés rögzítve — az esemény felvéve a listába', 'success')
          void queryClient.invalidateQueries({ queryKey: [...ehsKeys.all, 'incidents'] })
        }}
      />
    </WorldShell>
  )
}

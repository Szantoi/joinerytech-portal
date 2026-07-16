import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { WorldShell } from '../components/layout/WorldShell'
import { useToast } from '../components/ui'
import { IncidentReportFAB } from '../components/EHS/IncidentReportFAB'
import {
  ehsKeys,
  EhsDashboard,
  IncidentsScreen,
  RisksScreen,
  SdsScreen,
  PpeScreen,
  WalksScreen,
} from '../modules/ehs'

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

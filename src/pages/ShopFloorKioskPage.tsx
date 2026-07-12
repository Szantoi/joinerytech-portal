import { useState } from 'react'
import { OperatorLoginScreen } from '../components/shopfloor/kiosk/OperatorLoginScreen'
import { MachineQueueScreen } from '../components/shopfloor/kiosk/MachineQueueScreen'
import { BatchProductionScreen } from '../components/shopfloor/kiosk/BatchProductionScreen'
import type { OperatorSession, Batch } from '../types/shopfloor'

export function ShopFloorKioskPage() {
  const [session, setSession] = useState<OperatorSession | null>(null)
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null)

  if (!session) {
    return <OperatorLoginScreen onLogin={setSession} />
  }

  if (activeBatch) {
    return (
      <BatchProductionScreen
        batch={activeBatch}
        session={session}
        onComplete={() => setActiveBatch(null)}
        onCancel={() => setActiveBatch(null)}
      />
    )
  }

  return (
    <MachineQueueScreen
      session={session}
      onStartBatch={setActiveBatch}
      onLogout={() => setSession(null)}
    />
  )
}

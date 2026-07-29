import { useState, useEffect } from 'react'
import {
  addDays, Button, Card, isoDate, parseIsoDate, QueryGate, STATUS_TONES, useConfirm,
} from '@spaceos/portal-ui'
import { OperatorAutocomplete } from '../components/scheduling/OperatorAutocomplete'
import { BatchList } from '../components/scheduling/BatchList'
import { MachineDropZone } from '../components/scheduling/MachineDropZone'
import { ExecutionGantt } from '../components/scheduling/ExecutionGantt'
import { priorityLabel, priorityTone } from '../lib/scheduling/priority'
import { useApi, API_BASE } from '../hooks/useApi'
import { useSchedulePermissions } from '../hooks/useSchedulePermissions'
import { useBatchAssignment } from '../hooks/useBatchAssignment'
import type {
  Batch,
  Machine,
  Operator,
  Execution,
} from '../types/scheduling.types'

export function SchedulingPage() {
  const { maxPriority, isReadOnly } = useSchedulePermissions()

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  // HELYI dátum, nem UTC. A `toISOString().split('T')[0]` Budapesten éjfél és
  // 01:00/02:00 között még az ELŐZŐ napot adná — éjszakai műszakban pont az
  // látná a tegnapi tervet mainak, aki akkor dolgozik.
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()))
  const [draggedBatchId, setDraggedBatchId] = useState<string | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const { ask } = useConfirm()

  // Fetch data
  const {
    data: batches,
    isPending: isBatchesPending,
    error: batchesError,
    refetch: refetchBatches,
  } = useApi<Batch[]>(`${API_BASE.cutting}/api/batches?status=Unassigned`)
  useEffect(() => {
    refetchBatches()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: machines,
    isPending: isMachinesPending,
    error: machinesError,
    refetch: refetchMachines,
  } = useApi<Machine[]>(`${API_BASE.cutting}/api/machines`)
  useEffect(() => {
    refetchMachines()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: executions,
    isPending: isExecutionsPending,
    error: executionsError,
    refetch: refetchExecutions,
  } = useApi<Execution[]>(`${API_BASE.cutting}/api/plans/${selectedDate}/executions`)
  useEffect(() => {
    refetchExecutions()
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Az idősáv KÉT lekérésből áll össze (gép = sáv, végrehajtás = elem). Ha az
  // egyik hiányzik vagy elhasalt, a rács nem részleges, hanem HAMIS — üres
  // sávot mutatna ott, ahol lehet, hogy munka van. Ezért közös kapu.
  const isTimelinePending = isMachinesPending || isExecutionsPending
  const timelineError = machinesError ?? executionsError

  function refetchTimeline() {
    refetchMachines()
    refetchExecutions()
  }

  /** Naptári léptetés — DST-váltáskor sem csúszik át a szomszédos napra. */
  function stepDay(delta: number) {
    const current = parseIsoDate(selectedDate) ?? new Date()
    setSelectedDate(isoDate(addDays(current, delta)))
  }

  // A darabszám adatból jön: amíg nincs válasz, nem írunk ki „(0)"-t.
  const batchesHeading =
    isBatchesPending || batchesError !== null
      ? 'Kiosztatlan kötegek'
      : `Kiosztatlan kötegek (${(batches ?? []).length})`

  const { assignBatch, isLoading: isAssigning, error: assignError } = useBatchAssignment(selectedDate)

  // Batch priority update (optimistic)
  const batchesWithUpdates = (batches ?? []).map(b => b)

  /**
   * Kiosztás: a megerősítés a portál közös dialógusán megy (PLAN-05 F4).
   * A korábbi kézzel írt overlay-nek nem volt `role="dialog"`-ja, sem
   * fókuszcsapdája, és az Escape sem zárta — a strukturált összefoglaló
   * (köteg/gép/operátor/prioritás) most a primitív `details` mezőjén él.
   */
  async function handleBatchDrop(batchId: string, machineId: string) {
    const batch = batchesWithUpdates.find((b) => b.id === batchId)
    const machine = (machines ?? []).find((m) => m.id === machineId)

    if (!batch || !machine) return
    if (!selectedOperator) {
      setAssignmentError('Előbb válassz operátort')
      return
    }

    setAssignmentError(null)

    const confirmed = await ask({
      title: 'Köteg kiosztásának megerősítése',
      confirmLabel: 'Kiosztás megerősítése',
      cancelLabel: 'Mégse',
      details: [
        {
          label: 'Köteg',
          value: batch.name,
          hint: `Anyag: ${batch.materialType} · Mennyiség: ${batch.quantity}`,
        },
        {
          label: 'Célgép',
          value: machine.name,
          hint: `Kapacitás: ${machine.capacity} egység`,
        },
        {
          label: 'Kijelölt operátor',
          value: selectedOperator.name,
          hint: selectedOperator.email,
        },
        {
          label: 'Prioritás',
          value: `${batch.priority} — ${priorityLabel(batch.priority)}`,
          tone: priorityTone(batch.priority),
        },
      ],
    })

    if (!confirmed) return

    try {
      await assignBatch({
        batchId: batch.id,
        machineId: machine.id,
        operatorId: selectedOperator.id,
        priority: batch.priority,
        startTime: new Date().toISOString(),
      })

      refetchBatches()
      refetchExecutions()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'A köteg kiosztása nem sikerült'
      if (msg.includes('403')) {
        setAssignmentError('Nincs jogosultságod ehhez a prioritási szinthez')
      } else {
        setAssignmentError(msg)
      }
    }
  }

  // Filter assigned batches for each machine
  const getAssignedBatches = (machineId: string): Batch[] => {
    return (executions ?? [])
      .filter((e) => e.machineId === machineId)
      .map((e) => {
        const batch = batchesWithUpdates.find((b) => b.id === e.batchId)
        return batch || null
      })
      .filter((b): b is Batch => b !== null)
  }

  return (
    // Világ-képernyő: a keretet és a dokumentum-főcímet a WorldShell adja
    // (WorldShell.tsx:247), ezért itt NINCS saját h1 és nincs teljes képernyős
    // háttér — a szekció-címek h2-k. A doboz-méret a WorkflowPage precedense.
    <div className="px-7 py-5 max-w-[1600px] mx-auto">
      <p className="text-sm text-ink-soft mb-4">
        Rendeld a kötegeket gépekhez és operátorokhoz. Az ütemezéshez húzd rá a
        köteget a kívánt gépre.
      </p>

      {/* Terv napja — üzemi képernyőn a szomszédos napra lépés a gyakori
          mozdulat, ezért a léptetők a naptár MELLETT állnak, nem helyette. */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="plan-date" className="mb-1 block text-xs font-medium text-ink-soft">
            Terv napja
          </label>
          <input
            id="plan-date"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              // Félkész beírás (pl. „2026-0") ne rántsa el a lekéréseket.
              if (parseIsoDate(event.target.value)) setSelectedDate(event.target.value)
            }}
            className="h-9 rounded-lg border border-line bg-surface-card px-3 text-sm text-ink outline-none focus:border-line-strong"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Beszédes nevek: a puszta ‹ / › a képernyőolvasónak semmit nem mond. */}
          <Button variant="secondary" size="touch" onClick={() => stepDay(-1)}>
            Előző nap
          </Button>
          <Button variant="secondary" size="touch" onClick={() => setSelectedDate(isoDate(new Date()))}>
            Ma
          </Button>
          <Button variant="secondary" size="touch" onClick={() => stepDay(1)}>
            Következő nap
          </Button>
        </div>
      </div>

      {/* A dialógus bezárul a megerősítéskor, tehát a folyamatban lévő kiosztást
          itt kell visszajeleznünk — élő régióban, hogy hangosan is elhangozzon. */}
      {isAssigning && (
        <p role="status" className="mb-4 text-sm text-ink-soft">
          Kiosztás folyamatban…
        </p>
      )}

      {/* Kiosztási hiba */}
      {assignmentError && (
        <div role="alert" className={`mb-4 p-4 rounded-lg border border-line ${STATUS_TONES.danger.bg}`}>
          <p className={`text-sm ${STATUS_TONES.danger.fg}`}>{assignmentError}</p>
        </div>
      )}

      {/* Fő rács */}
      <div className="grid grid-cols-12 gap-4">
        {/* Bal oldal — operátor és kötegek */}
        <div className="col-span-4 space-y-4">
          {/* Operátor kiválasztása */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">Operátor kiválasztása</h2>
            <OperatorAutocomplete
              selectedOperator={selectedOperator}
              onOperatorChange={setSelectedOperator}
              disabled={isReadOnly}
            />
            {isReadOnly && (
              <p className="text-xs text-ink-muted mt-2">
                Csak megtekintés: nem oszthatsz ki köteget
              </p>
            )}
          </Card>

          {/* Köteg-lista */}
          <Card>
            <h2 className="font-semibold text-ink mb-3">{batchesHeading}</h2>
            <QueryGate
              isPending={isBatchesPending}
              isError={batchesError !== null}
              onRetry={refetchBatches}
              resource="kötegek"
            >
              <BatchList
                batches={batchesWithUpdates}
                maxPriority={maxPriority}
                onPriorityChange={() => {
                  // A prioritás-módosítás MVP-ben a BatchCard-on belül marad
                }}
                onDragStart={(batch) => setDraggedBatchId(batch.id)}
                onDragEnd={() => setDraggedBatchId(null)}
                readOnly={isReadOnly}
                draggedBatchId={draggedBatchId}
              />
            </QueryGate>
          </Card>
        </div>

        {/* Jobb oldal — gépek és idősáv */}
        <div className="col-span-8 space-y-4">
          {/* Gép-hozzárendelés */}
          <Card>
            <h2 className="font-semibold text-ink mb-4">Gép-hozzárendelés</h2>
            <QueryGate
              isPending={isMachinesPending}
              isError={machinesError !== null}
              onRetry={refetchMachines}
              resource="gépek"
            >
              <div className="grid grid-cols-2 gap-3">
                {(machines ?? []).map((machine) => (
                  <MachineDropZone
                    key={machine.id}
                    machine={machine}
                    assignedBatches={getAssignedBatches(machine.id)}
                    onBatchDrop={handleBatchDrop}
                    isDropTarget={draggedBatchId !== null}
                  />
                ))}
              </div>
              {machines && machines.length === 0 && (
                <p className="text-center text-sm text-ink-muted py-6">Nincs elérhető gép</p>
              )}
            </QueryGate>
          </Card>

          {/* Végrehajtási idősáv */}
          <QueryGate
            isPending={isTimelinePending}
            isError={timelineError !== null}
            onRetry={refetchTimeline}
            resource="végrehajtási idősáv"
          >
            <ExecutionGantt
              machines={machines ?? []}
              executions={executions ?? []}
              planDate={selectedDate}
            />
          </QueryGate>
        </div>
      </div>

    </div>
  )
}

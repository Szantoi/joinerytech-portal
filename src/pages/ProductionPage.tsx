import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, StatusPill, Icon, useToast } from '../components/ui'
import { I18N } from '../mocks/data'
import { useApi, API_BASE } from '../hooks/useApi'
import { useCuttingPlanGeneration } from '../hooks/useCuttingPlanGeneration'
import { NestingViewer, type NestingResultDto, type NestingResultResponse, mapNestingResponse } from '../components/NestingViewer'
import { BatchScheduler, type Batch } from '../components/BatchScheduler'
import { BatchTimeline, DraggableBatchList, type ScheduledBatch } from '../components/BatchTimeline'
import { BatchAssignmentBoard, type MachineBatch } from '../components/machining/BatchAssignmentBoard'
import { FilterPanel, type FilterCategory } from '../components/filters'

interface ApiCuttingPlan {
  id: string
  name: string
  date: string
  status: string
  orderReference?: string
  customerName?: string
}

const PLAN_STATUS_MAP: Record<string, string> = {
  Draft:     'draft',
  Planned:   'planned',
  Running:   'running',
  Done:      'done',
}

export function ProductionPage({ initialTab = 'cutting' }: { initialTab?: 'cutting' | 'machining' }) {
  const t = I18N.hu
  const location = useLocation()
  const { addToast } = useToast()
  const [tab, setTab] = useState<'cutting' | 'machining'>(initialTab)
  const [cuttingView, setCuttingView] = useState<'nesting' | 'scheduling'>('nesting')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null)
  const planRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Filter state
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(true)

  // Cutting plan generation
  const { status: planStatus, plan: generatedPlan, error: planError, generate: generatePlan, reset: resetPlan } = useCuttingPlanGeneration()
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const { data: apiPlans, refetch: fetchPlans } = useApi<ApiCuttingPlan[]>(
    `${API_BASE.cutting}/api/cutting/plans`
  )
  useEffect(() => { fetchPlans() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch nesting data for selected plan (backend DTO)
  const { data: nestingBackendData, refetch: fetchNesting } = useApi<NestingResultResponse>(
    selectedPlan ? `${API_BASE.cutting}/api/cutting/sheets/${selectedPlan}/nesting` : null
  )
  useEffect(() => {
    if (selectedPlan) fetchNesting()
  }, [selectedPlan]) // eslint-disable-line react-hooks/exhaustive-deps

  // Map backend DTO to frontend display format
  const nestingData = useMemo(() => {
    if (!nestingBackendData) return null
    return mapNestingResponse(nestingBackendData)
  }, [nestingBackendData])

  // Handle highlightPlanId from navigation state
  useEffect(() => {
    const highlightPlanId = (location.state as { highlightPlanId?: string })?.highlightPlanId
    if (highlightPlanId) {
      setSelectedPlan(highlightPlanId)
      setHighlightedPlan(highlightPlanId)

      // Show toast notification
      addToast(`Vágási terv létrehozva: ${highlightPlanId.slice(0, 8).toUpperCase()}`, 'success')

      // Scroll to the highlighted plan after a short delay to ensure rendering
      setTimeout(() => {
        planRefs.current[highlightPlanId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedPlan(null)
      }, 3000)
    }
  }, [location.state, addToast])

  const displayPlans = apiPlans?.map(p => ({
    id: p.id,
    displayId: p.name || p.id.slice(0, 12).toUpperCase(),
    material: p.date,
    sheets: 1,
    util: 0,
    status: PLAN_STATUS_MAP[p.status] ?? 'draft',
    order: p.orderReference || '—',
    customerName: p.customerName || '',
    machine: '—',
    operator: '—',
    isApiPlan: true,
  })) ?? []

  // Filter categories (MVP mock data)
  const filterCategories: FilterCategory[] = [
    {
      key: 'status',
      label: 'Státusz',
      options: [
        { value: 'draft', label: 'Tervezet', count: displayPlans.filter(p => p.status === 'draft').length },
        { value: 'planned', label: 'Tervezett', count: displayPlans.filter(p => p.status === 'planned').length },
        { value: 'running', label: 'Fut', count: displayPlans.filter(p => p.status === 'running').length },
        { value: 'done', label: 'Kész', count: displayPlans.filter(p => p.status === 'done').length },
      ],
    },
  ]

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (Object.values(filters).every(arr => arr.length === 0)) {
      return displayPlans
    }
    return displayPlans.filter(plan => {
      // Status filter
      if (filters.status?.length > 0 && !filters.status.includes(plan.status)) {
        return false
      }
      return true
    })
  }, [displayPlans, filters])

  const currentPlanData = selectedPlan
    ? (filteredPlans.find(p => p.id === selectedPlan) ?? null)
    : null

  // Mock data for batch scheduling (in real app, this would come from API)
  const currentDate = new Date().toISOString().split('T')[0]

  const mockBatches: Batch[] = [
    { id: 'b1', planId: 'p1', planName: 'CP-2026-001-A', status: 'pending', partsCount: 45 },
    { id: 'b2', planId: 'p2', planName: 'CP-2026-002-B', status: 'pending', partsCount: 32 },
    { id: 'b3', planId: 'p3', planName: 'CP-2026-003-C', status: 'pending', partsCount: 28 },
  ]

  const mockScheduledBatches: ScheduledBatch[] = [
    {
      id: 'sb1',
      planName: 'CP-2026-004-A',
      machineId: 'm1',
      machineName: 'Holzma HPP 380',
      operatorName: 'Nagy János',
      priority: 8,
      startTime: `${currentDate}T08:00:00`,
      status: 'running',
      partsCount: 56,
      completionPercent: 67,
    },
    {
      id: 'sb2',
      planName: 'CP-2026-005-B',
      machineId: 'm1',
      machineName: 'Holzma HPP 380',
      operatorName: 'Kovács Anna',
      priority: 5,
      startTime: `${currentDate}T11:30:00`,
      status: 'scheduled',
      partsCount: 42,
    },
    {
      id: 'sb3',
      planName: 'CP-2026-006-C',
      machineId: 'm2',
      machineName: 'Selco WN 750',
      operatorName: 'Tóth Péter',
      priority: 3,
      startTime: `${currentDate}T09:15:00`,
      status: 'scheduled',
      partsCount: 38,
    },
  ]

  const [scheduledBatches, setScheduledBatches] = useState<ScheduledBatch[]>(mockScheduledBatches)

  const machines = [
    { id: 'm1', name: 'Holzma HPP 380', type: 'Panel Saw' },
    { id: 'm2', name: 'Selco WN 750', type: 'Panel Saw' },
    { id: 'm3', name: 'Homag BMG 512', type: 'CNC Router' },
  ]

  const handleBatchReorder = (fromIndex: number, toIndex: number) => {
    const newBatches = [...scheduledBatches]
    const [movedBatch] = newBatches.splice(fromIndex, 1)
    newBatches.splice(toIndex, 0, movedBatch)
    setScheduledBatches(newBatches)
  }

  const handleTimelineReorder = (batchId: string, newMachineId: string, newStartTime: string) => {
    setScheduledBatches(prev =>
      prev.map(b =>
        b.id === batchId
          ? { ...b, machineId: newMachineId, startTime: newStartTime, machineName: machines.find(m => m.id === newMachineId)?.name ?? b.machineName }
          : b
      )
    )
  }

  // Handle cutting plan generation
  const handleGenerateCuttingPlan = async () => {
    if (selectedOrderIds.length === 0) return

    await generatePlan({
      date: currentDate,
      capacity: 1000, // mm² or time-based, backend will interpret
      orders: selectedOrderIds,
    })
  }

  // Mock machining batches for BatchAssignmentBoard
  const mockMachiningBatches: MachineBatch[] = [
    { id: 'b1', planId: 'cp-184', planName: 'CP-184-A · Bükk', materialType: 'Bükk 18mm', partsCount: 24, status: 'unassigned' },
    { id: 'b2', planId: 'cp-183', planName: 'CP-183-A · MDF', materialType: 'MDF 16mm', partsCount: 18, status: 'unassigned' },
    { id: 'b3', planId: 'cp-182', planName: 'CP-182-A · Tölgy', materialType: 'Tölgy 22mm', partsCount: 32, status: 'unassigned' },
    { id: 'b4', planId: 'cp-180', planName: 'CP-180-A · Éger', materialType: 'Éger 18mm', partsCount: 15, status: 'assigned', assignedMachine: 'cnc', assignedOperator: 'Nagy János', assignedOperatorId: 'u1', priority: 7, startTime: '2026-06-22T08:00' },
    { id: 'b5', planId: 'cp-179', planName: 'CP-179-B · Dió', materialType: 'Dió 22mm', partsCount: 28, status: 'running', assignedMachine: 'edgebanding', assignedOperator: 'Tóth Katalin', assignedOperatorId: 'u2', priority: 8, startTime: '2026-06-22T07:00' },
    { id: 'b6', planId: 'cp-178', planName: 'CP-178-A · Fenyő', materialType: 'Fenyő 18mm', partsCount: 12, status: 'completed', assignedMachine: 'qc', assignedOperator: 'Horváth Éva', assignedOperatorId: 'u3', priority: 5, startTime: '2026-06-22T06:00' },
  ]

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 w-fit mb-5">
        {[
          { k: 'cutting' as const, label: t.prod.tabs.cutting },
          { k: 'machining' as const, label: t.prod.tabs.machining },
        ].map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`px-3 h-8 rounded-md text-[12.5px] font-medium transition ${
              tab === x.k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'cutting' && (
        <>
          {/* View switcher */}
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 w-fit mb-3">
            {[
              { k: 'nesting' as const, label: 'Nesting' },
              { k: 'scheduling' as const, label: 'Ütemezés' },
            ].map((x) => (
              <button
                key={x.k}
                onClick={() => setCuttingView(x.k)}
                className={`px-3 h-7 rounded-md text-[11.5px] font-medium transition ${
                  cuttingView === x.k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>

          {cuttingView === 'nesting' && (
        <div className="grid grid-cols-12 gap-3">
          {/* Plan list */}
          <Card className="col-span-4 p-0">
            <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
              <div className="text-[12.5px] font-semibold text-stone-900">{t.prod.cuttingPlans}</div>
              <span className="text-[10.5px] text-stone-500 tabular-nums">{filteredPlans.length}</span>
            </div>
            <FilterPanel
              categories={filterCategories}
              selected={filters}
              onChange={(categoryKey, values) => {
                setFilters(prev => ({ ...prev, [categoryKey]: values }))
              }}
              collapsed={filterPanelCollapsed}
              onCollapsedChange={setFilterPanelCollapsed}
            />
            <div className="max-h-[640px] overflow-auto">
              {filteredPlans.map((p) => {
                const active = p.id === selectedPlan
                const seed = p.displayId.charCodeAt(p.displayId.length - 1)
                const progress = p.status === 'running' ? 30 + (seed * 7) % 55 : p.status === 'done' ? 100 : 0
                const runtimeMin = p.status === 'running' ? 12 + (seed * 3) % 35 : p.status === 'done' ? 38 + (seed * 2) % 22 : 0
                const proof = p.status === 'done'
                return (
                  <button
                    key={p.id}
                    ref={(el) => { planRefs.current[p.id] = el }}
                    onClick={() => { setSelectedPlan(p.id) }}
                    className={`w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 transition-all ${
                      active ? 'bg-teal-50/60' : 'hover:bg-stone-50'
                    } ${highlightedPlan === p.id ? 'border-l-4 border-l-teal-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11.5px] font-mono text-stone-700">{p.displayId}</span>
                      <span className="inline-flex items-center gap-1.5">
                        {proof && (
                          <span title="Bizonylat csatolva" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <Icon name="check" size={9} />proof
                          </span>
                        )}
                        <StatusPill status={p.status} label={t.status[p.status as keyof typeof t.status] ?? p.status} />
                      </span>
                    </div>
                    <div className="text-[12.5px] font-medium text-stone-900">
                      {p.customerName && p.order !== '—'
                        ? `${p.customerName} · ${p.order}`
                        : p.customerName || p.material || p.order}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-stone-500">
                      {!p.isApiPlan && <><span className="font-mono">{p.sheets} {t.prod.sheet}</span><span>·</span></>}
                      {!p.isApiPlan && <span>{t.prod.utilization} {p.util}%</span>}
                      {p.status === 'running' && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-teal-700">{runtimeMin} perc futás</span>
                        </>
                      )}
                    </div>
                    {p.status === 'running' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full"
                            style={{ width: `${progress}%`, boxShadow: '0 0 6px rgba(13,148,136,.4)' }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums font-mono text-teal-700 w-9 text-right">{progress}%</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Nesting viewer */}
          <Card className="col-span-8 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{t.prod.nesting}</div>
                <div className="text-[15px] font-semibold text-stone-900 mt-0.5">
                  {currentPlanData ? `${currentPlanData.displayId} · ${currentPlanData.material}` : '—'}
                </div>
                <div className="text-[11.5px] text-stone-500 mt-0.5 font-mono">
                  {currentPlanData ? `${currentPlanData.order} · ${currentPlanData.machine} · ${currentPlanData.operator}` : 'Nincs kiválasztott terv'}
                </div>
              </div>
            </div>

            {/* Nesting visualization */}
            {nestingData ? (
              <NestingViewer data={nestingData} />
            ) : (
              <div className="flex items-center justify-center h-52 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-400 text-[13px]">
                {currentPlanData ? 'Nesting API nem elérhető' : 'Válasszon vágási tervet a megjelenítéshez'}
              </div>
            )}
          </Card>
        </div>
          )}

          {cuttingView === 'scheduling' && (
            <div className="space-y-4">
              {/* Cutting Plan Generation Section */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[12.5px] font-semibold text-stone-900">Napi vágási terv generálása</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Válasszon rendeléseket és generálja a vágási tervet</div>
                  </div>
                </div>

                {/* Plan Generation Status */}
                {planStatus === 'idle' && !generatedPlan && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateCuttingPlan}
                      disabled={selectedOrderIds.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Icon name="play" size={14} />
                      Terv generálása ({selectedOrderIds.length})
                    </button>
                    <span className="text-[11px] text-stone-500">
                      {selectedOrderIds.length === 0 ? 'Válasszon legalább egy rendelést' : `${selectedOrderIds.length} rendelés kiválasztva`}
                    </span>
                  </div>
                )}

                {planStatus === 'generating' && (
                  <div className="flex items-center gap-2 text-[12px] text-stone-600">
                    <span className="w-3 h-3 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                    Terv generálása folyamatban…
                  </div>
                )}

                {planStatus === 'polling' && (
                  <div className="flex items-center gap-2 text-[12px] text-stone-600">
                    <span className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    Terv feldolgozása: <span className="font-mono text-amber-700">{generatedPlan?.id?.slice(0, 8)}</span>
                  </div>
                )}

                {planStatus === 'complete' && generatedPlan && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200/70 rounded-lg">
                      <Icon name="check" size={16} className="text-emerald-600" />
                      <span className="text-[12px] text-emerald-900 font-medium">
                        Terv készült: <span className="font-mono">{generatedPlan.id}</span> • {generatedPlan.sheets.length} lap
                      </span>
                      <button
                        onClick={resetPlan}
                        className="ml-auto text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        Új terv
                      </button>
                    </div>

                    {/* Plan Details */}
                    <div className="bg-stone-50/60 border border-stone-200/70 rounded-lg p-3">
                      <div className="text-[11px] text-stone-600 mb-2 font-medium">Terv részletei:</div>
                      <div className="space-y-1">
                        {generatedPlan.sheets.map((sheet, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] text-stone-700">
                            <span>
                              <span className="font-mono">{sheet.sheetId}</span> • {sheet.parts.length} rész
                            </span>
                            <span className="text-stone-500">{sheet.wastePercent.toFixed(1)}% veszteség</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {planStatus === 'error' && planError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200/70 rounded-lg">
                    <Icon name="alert" size={16} className="text-rose-600" />
                    <div className="flex-1">
                      <div className="text-[12px] text-rose-900 font-medium">Hiba történt</div>
                      <div className="text-[11px] text-rose-800">{planError}</div>
                    </div>
                    <button
                      onClick={resetPlan}
                      className="text-[11px] text-rose-700 hover:text-rose-900 font-medium"
                    >
                      Próbálja újra
                    </button>
                  </div>
                )}
              </Card>

              {/* Batch assignment section */}
              <BatchScheduler
                date={currentDate}
                batches={mockBatches}
                onAssignSuccess={() => {
                  // In real app, refetch scheduled batches
                  console.log('Batch assigned successfully')
                }}
              />

              {/* Timeline section */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-9">
                  <BatchTimeline
                    date={currentDate}
                    scheduledBatches={scheduledBatches}
                    machines={machines}
                    onReorder={handleTimelineReorder}
                  />
                </div>
                <div className="col-span-3">
                  <DraggableBatchList
                    batches={scheduledBatches}
                    onReorder={handleBatchReorder}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'machining' && (
        <BatchAssignmentBoard
          date={currentDate}
          batches={mockMachiningBatches}
          onAssignSuccess={() => {
            console.log('Machining batch assigned successfully')
            addToast('Batch hozzárendelve', 'success')
          }}
        />
      )}
    </div>
  )
}

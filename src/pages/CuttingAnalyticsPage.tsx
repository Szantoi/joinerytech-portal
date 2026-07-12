import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, Icon } from '../components/ui'
import { useApi, API_BASE } from '../hooks/useApi'
import { Skeleton, SkeletonCard, SkeletonChart } from '../components/Skeleton'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface WasteTrendData {
  date: string
  wastePercent: number
  utilization: number
}

interface MachineOEEData {
  machineId: string
  machineName: string
  availability: number
  performance: number
  quality: number
  oeeScore: number
}

interface MaterialUsageData {
  date: string
  areaSqM: number
  sheets: number
}

interface WasteTrendResponse {
  data: WasteTrendData[]
}

interface OEEResponse {
  data: MachineOEEData[]
}

interface MaterialUsageResponse {
  data: MaterialUsageData[]
}

// ─── Mock Data (fallback when API is unavailable) ─────────────────────────────

const MOCK_WASTE_TREND: WasteTrendData[] = [
  { date: '2026-06-15', wastePercent: 14.2, utilization: 85.8 },
  { date: '2026-06-16', wastePercent: 12.8, utilization: 87.2 },
  { date: '2026-06-17', wastePercent: 15.1, utilization: 84.9 },
  { date: '2026-06-18', wastePercent: 11.3, utilization: 88.7 },
  { date: '2026-06-19', wastePercent: 13.5, utilization: 86.5 },
  { date: '2026-06-20', wastePercent: 10.7, utilization: 89.3 },
  { date: '2026-06-21', wastePercent: 12.1, utilization: 87.9 },
]

const MOCK_OEE: MachineOEEData[] = [
  { machineId: 'm1', machineName: 'Holzma HPP 380', availability: 92, performance: 88, quality: 96, oeeScore: 77.8 },
  { machineId: 'm2', machineName: 'Selco WN 750', availability: 88, performance: 85, quality: 94, oeeScore: 70.3 },
  { machineId: 'm3', machineName: 'Homag BMG 512', availability: 95, performance: 90, quality: 98, oeeScore: 83.8 },
]

const MOCK_MATERIAL_USAGE: MaterialUsageData[] = [
  { date: '2026-06-15', areaSqM: 128.5, sheets: 18 },
  { date: '2026-06-16', areaSqM: 145.2, sheets: 21 },
  { date: '2026-06-17', areaSqM: 132.8, sheets: 19 },
  { date: '2026-06-18', areaSqM: 156.3, sheets: 23 },
  { date: '2026-06-19', areaSqM: 138.7, sheets: 20 },
  { date: '2026-06-20', areaSqM: 142.1, sheets: 21 },
  { date: '2026-06-21', areaSqM: 149.5, sheets: 22 },
]

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getOEEColor(score: number): string {
  if (score >= 85) return 'bg-emerald-600'
  if (score >= 70) return 'bg-amber-500'
  return 'bg-rose-600'
}

function getOEETextColor(score: number): string {
  if (score >= 85) return 'text-emerald-700'
  if (score >= 70) return 'text-amber-700'
  return 'text-rose-700'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// ─── CuttingAnalyticsPage Component ────────────────────────────────────────────

export function CuttingAnalyticsPage() {
  // API calls with fallback to mock data
  const { data: wasteResponse, isLoading: wasteLoading, error: wasteError, refetch: refetchWaste } = useApi<WasteTrendResponse>(
    `${API_BASE.cutting}/api/cutting/analytics/waste`
  )

  const { data: oeeResponse, isLoading: oeeLoading, error: oeeError, refetch: refetchOEE } = useApi<OEEResponse>(
    `${API_BASE.cutting}/api/cutting/analytics/oee`
  )

  const { data: materialResponse, isLoading: materialLoading, error: materialError, refetch: refetchMaterial } = useApi<MaterialUsageResponse>(
    `${API_BASE.cutting}/api/cutting/analytics/material-usage`
  )

  // Use mock data if API fails
  const wasteTrendData = wasteResponse?.data ?? MOCK_WASTE_TREND
  const oeeData = oeeResponse?.data ?? MOCK_OEE
  const materialUsageData = materialResponse?.data ?? MOCK_MATERIAL_USAGE

  // Calculate averages
  const avgWaste = useMemo(() => {
    if (!wasteTrendData || wasteTrendData.length === 0) return 0
    const sum = wasteTrendData.reduce((acc, d) => acc + d.wastePercent, 0)
    return sum / wasteTrendData.length
  }, [wasteTrendData])

  const avgOEE = useMemo(() => {
    if (!oeeData || oeeData.length === 0) return 0
    const sum = oeeData.reduce((acc, m) => acc + m.oeeScore, 0)
    return sum / oeeData.length
  }, [oeeData])

  const totalMaterialSqM = useMemo(() => {
    if (!materialUsageData || materialUsageData.length === 0) return 0
    return materialUsageData.reduce((acc, d) => acc + d.areaSqM, 0)
  }, [materialUsageData])

  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">
          Elemzés
        </div>
        <div className="text-[18px] font-semibold text-stone-900 mt-0.5">
          Cutting Analytics
        </div>
        <div className="text-[12px] text-stone-600 mt-1">
          7 napos teljesítmény áttekintés · 2026-06-15 – 2026-06-21
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {(wasteLoading || oeeLoading || materialLoading) ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 grid place-items-center shrink-0">
                  <Icon name="alert" size={18} className="text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Átlag hulladék</div>
                  <div className="text-[20px] font-bold text-stone-900 tabular-nums">
                    {avgWaste.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 grid place-items-center shrink-0">
                  <Icon name="trending" size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Átlag OEE</div>
                  <div className="text-[20px] font-bold text-stone-900 tabular-nums">
                    {avgOEE.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 grid place-items-center shrink-0">
                  <Icon name="layers" size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] text-stone-500 uppercase tracking-wide">Összes anyag</div>
                  <div className="text-[20px] font-bold text-stone-900 tabular-nums">
                    {totalMaterialSqM.toFixed(0)} m²
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Waste Trend Chart */}
        <Card className="col-span-8 p-5">
          <div className="mb-4">
            <div className="text-[13px] font-semibold text-stone-900">Hulladék trend</div>
            <div className="text-[11px] text-stone-500 mt-0.5">7 napos hulladék százalék alakulása</div>
          </div>

          {wasteLoading ? (
            <SkeletonChart />
          ) : wasteError ? (
            <div className="h-64 grid place-items-center">
              <div className="text-center">
                <div className="text-[12px] text-rose-600 mb-3">API nem elérhető, mock adatok használata</div>
                <button
                  onClick={() => refetchWaste()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-stone-700 text-[12px] font-medium rounded-lg hover:bg-stone-50 transition"
                >
                  <Icon name="refresh" size={12} />
                  Újrapróbálás
                </button>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={wasteTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  domain={[0, 20]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : '—'}
                  labelFormatter={(label) => `Dátum: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="wastePercent"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Hulladék %"
                  dot={{ fill: '#dc2626', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#0d9488"
                  strokeWidth={2}
                  name="Kihasználtság %"
                  dot={{ fill: '#0d9488', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Material Usage Chart */}
        <Card className="col-span-4 p-5">
          <div className="mb-4">
            <div className="text-[13px] font-semibold text-stone-900">Anyagfelhasználás</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Napi m² felhasználás</div>
          </div>

          {materialLoading ? (
            <SkeletonChart />
          ) : materialError ? (
            <div className="h-64 grid place-items-center">
              <div className="text-center">
                <div className="text-[12px] text-rose-600 mb-3">API nem elérhető</div>
                <button
                  onClick={() => refetchMaterial()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-stone-700 text-[12px] font-medium rounded-lg hover:bg-stone-50 transition"
                >
                  <Icon name="refresh" size={12} />
                  Újrapróbálás
                </button>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={materialUsageData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: '#78716c' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e7e5e4' }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)} m²` : '—'}
                />
                <Bar dataKey="areaSqM" fill="#3b82f6" name="m²" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Machine OEE Dashboard */}
        <Card className="col-span-12 p-5">
          <div className="mb-4">
            <div className="text-[13px] font-semibold text-stone-900">Gép OEE Dashboard</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Overall Equipment Effectiveness = Availability × Performance × Quality
            </div>
          </div>

          {oeeLoading ? (
            <SkeletonChart />
          ) : oeeError ? (
            <div className="mb-3 flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-[12px] text-rose-700">
                API nem elérhető, mock adatok használata
              </div>
              <button
                onClick={() => refetchOEE()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-700 text-[11px] font-medium rounded-lg hover:bg-rose-50 transition"
              >
                <Icon name="refresh" size={11} />
                Újrapróbálás
              </button>
            </div>
          ) : null}

          {!oeeLoading && (
          <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {oeeData.map((machine) => (
              <Card key={machine.machineId} className="p-4 bg-stone-50/60">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[11.5px] font-medium text-stone-900">{machine.machineName}</div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">{machine.machineId.toUpperCase()}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-md ${getOEETextColor(machine.oeeScore)} text-[13px] font-bold tabular-nums`}>
                    {machine.oeeScore.toFixed(1)}%
                  </div>
                </div>

                {/* OEE Score bar */}
                <div className="mb-3">
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getOEEColor(machine.oeeScore)} transition-all duration-500`}
                      style={{ width: `${machine.oeeScore}%` }}
                    />
                  </div>
                </div>

                {/* Component scores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-stone-600">Rendelkezésre állás</span>
                    <span className="font-mono text-stone-900">{machine.availability}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-stone-600">Teljesítmény</span>
                    <span className="font-mono text-stone-900">{machine.performance}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-stone-600">Minőség</span>
                    <span className="font-mono text-stone-900">{machine.quality}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* OEE Comparison Chart */}
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={oeeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="machineName"
                tick={{ fontSize: 11, fill: '#78716c' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e7e5e4' }}
                formatter={(value) => typeof value === 'number' ? `${value}%` : '—'}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="availability" fill="#0d9488" name="Rendelkezésre állás" radius={[4, 4, 0, 0]} />
              <Bar dataKey="performance" fill="#3b82f6" name="Teljesítmény" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quality" fill="#10b981" name="Minőség" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </>
          )}
        </Card>
      </div>
    </div>
  )
}

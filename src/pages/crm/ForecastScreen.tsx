import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, QueryGate, StatusPill } from '../../components/ui'
import { useOpps, weightedValue, OPP_OPEN_STAGES, OPP_STAGE_PROBABILITY } from '../../services/crm'
import { OPP_STATUS_LABELS, formatMoney } from './labels'

/**
 * Forecast — súlyozott pipeline fázisonként (recharts oszlopdiagram, EGY
 * adatsor: jelmagyarázat nélkül, a cím nevezi meg; világ-akcent kék, lekerekített
 * oszlopvég, visszafogott rács — dataviz irányelvek) + részletes táblázat.
 */

const BAR_FILL = '#3b82f6' // Tailwind blue-500 — a CRM világ-akcent (worldAccents: crm=blue)

export function ForecastScreen() {
  const opps = useOpps()

  const openOpps = (opps.data ?? []).filter((o) => (OPP_OPEN_STAGES as readonly string[]).includes(o.status))
  const won = (opps.data ?? []).filter((o) => o.status === 'megnyert')

  const byStage = OPP_OPEN_STAGES.map((stage) => {
    const items = openOpps.filter((o) => o.status === stage)
    const value = items.reduce((s, o) => s + o.value, 0)
    return {
      stage,
      label: OPP_STATUS_LABELS[stage],
      count: items.length,
      value,
      prob: OPP_STAGE_PROBABILITY[stage],
      weighted: items.reduce((s, o) => s + weightedValue(o.value, o.status), 0),
    }
  })

  const pipeline = openOpps.reduce((s, o) => s + o.value, 0)
  const weighted = byStage.reduce((s, r) => s + r.weighted, 0)
  const wonTotal = won.reduce((s, o) => s + o.value, 0)

  const chartData = byStage.map((r) => ({ name: r.label, weighted: r.weighted }))

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-5 md:px-7 md:py-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Forecast</h1>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          Súlyozott pipeline a fázis-valószínűségekkel (10/25/40/55/80%)
        </p>
      </div>

      <QueryGate isPending={opps.isPending} isError={opps.isError}
        onRetry={() => void opps.refetch()} resource="forecast">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Pipeline (bruttó)', val: formatMoney(pipeline) },
            { label: 'Súlyozott forecast', val: formatMoney(weighted) },
            { label: 'Megnyert (YTD)', val: formatMoney(wonTotal) },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{s.label}</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-ink">{s.val}</div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <h2 className="mb-4 text-[13px] font-semibold text-ink">Súlyozott érték fázisonként</h2>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatMoney(v)}
                  width={72}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(120, 113, 108, 0.08)' }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                  formatter={(value) => [typeof value === 'number' ? formatMoney(value) : '—', 'Súlyozott érték']}
                />
                <Bar dataKey="weighted" fill={BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">A diagram adatai az alábbi táblázatban olvashatók.</p>
        </Card>

        {/* Táblázat-nézet — a diagram adatai hozzáférhető formában */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <caption className="sr-only">Forecast fázisonként: darab, érték, valószínűség, súlyozott érték</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2/60">
                  {['Fázis', 'Darab', 'Érték', 'Valószínűség', 'Súlyozott érték'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStage.map((r) => (
                  <tr key={r.stage} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-2.5">
                      <StatusPill size="sm" fsm="crmOpportunity" status={r.stage} label={r.label} />
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-ink">{r.count}</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-ink">{formatMoney(r.value)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-muted">{Math.round(r.prob * 100)}%</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-ink">{formatMoney(r.weighted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </QueryGate>
    </div>
  )
}

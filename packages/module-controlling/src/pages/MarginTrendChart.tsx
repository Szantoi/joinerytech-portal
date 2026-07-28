import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MarginTrendPoint } from '../services'
import { formatMonth } from './labels'

/**
 * Fedezet-trend diagram (vezetői áttekintés) — terv vs. tény fedezet-% havi
 * bontásban. KÜLÖN lazy chunk (a recharts csak itt töltődik be a Kontrolling
 * világban); világ-akcent: slate. Default export a React.lazy()-hez.
 */

const ACTUAL_STROKE = 'var(--acc-mid)' // token: Kontrolling világ-akcent (light: slate-600, dark: oklch-recept)
const PLAN_STROKE = 'var(--chart-ref)' // token: visszafogott referencia-vonal (light: stone-400)

export default function MarginTrendChart({ trend }: { trend: MarginTrendPoint[] }) {
  const data = trend.map((p) => ({
    name: formatMonth(p.month),
    terv: Math.round(p.planMarginPct * 100),
    teny: Math.round(p.actualMarginPct * 100),
  }))

  return (
    <>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: 'var(--text-secondary)', strokeOpacity: 0.3 }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-card)', color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value, name) => [`${String(value)}%`, name === 'teny' ? 'Tény-fedezet' : 'Terv-fedezet']}
            />
            <Line type="monotone" dataKey="terv" stroke={PLAN_STROKE} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="teny" stroke={ACTUAL_STROKE} strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Teljes hozzáférhető adat-alternatíva (M3, CRM ForecastScreen minta):
          a diagram aria-hidden, a trend MINDEN pontja sr-only táblázatban
          olvasható caption + th scope-pal. */}
      <table className="sr-only">
        <caption>Fedezet-trend havi bontásban: terv- és tény-fedezet százalék</caption>
        <thead>
          <tr>
            <th scope="col">Hónap</th>
            <th scope="col">Terv-fedezet</th>
            <th scope="col">Tény-fedezet</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name}>
              <th scope="row">{d.name}</th>
              <td>{d.terv}%</td>
              <td>{d.teny}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[10.5px] text-ink-muted">
        <span aria-hidden="true" className="mr-1 inline-block h-0.5 w-4 translate-y-[-2px] bg-chart-ref" />
        terv (szaggatott) ·{' '}
        <span aria-hidden="true" className="mr-1 inline-block h-0.5 w-4 translate-y-[-2px] bg-acc-mid" />
        tény
      </p>
    </>
  )
}

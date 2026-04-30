import { Card, Sparkline, GhostBtn } from '../components/ui'
import { I18N, SPARKS } from '../mocks/data'

export function AnalyticsPage() {
  const t = I18N.hu

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900">{t.ana.title}</h2>
          <p className="text-[12px] text-stone-500 mt-0.5">{t.ana.sub}</p>
        </div>
        <GhostBtn icon="download">{t.ana.export}</GhostBtn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{t.ana.waste}</div>
          <div className="text-[28px] font-semibold text-stone-900 mt-2">8.2%</div>
          <div className="text-[11px] text-emerald-600 mt-1">-1.4% vs. előző hónap</div>
          <div className="mt-3 text-teal-600">
            <Sparkline data={SPARKS.wasteRate} width={200} height={40} stroke="currentColor" fill="currentColor" responsive />
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{t.ana.capacity}</div>
          <div className="text-[28px] font-semibold text-stone-900 mt-2">76%</div>
          <div className="text-[11px] text-amber-600 mt-1">+3% vs. előző hónap</div>
          <div className="mt-3 text-amber-500">
            <Sparkline data={SPARKS.capacity} width={200} height={40} stroke="currentColor" fill="currentColor" responsive />
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">{t.ana.oee}</div>
          <div className="text-[28px] font-semibold text-stone-900 mt-2">68.4%</div>
          <div className="text-[11px] text-emerald-600 mt-1">+5.1% vs. előző hónap</div>
          <div className="mt-3 text-emerald-500">
            <Sparkline data={SPARKS.oee} width={200} height={40} stroke="currentColor" fill="currentColor" responsive />
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <div className="text-[14px] text-stone-500">Részletes elemzések hamarosan</div>
      </Card>
    </div>
  )
}

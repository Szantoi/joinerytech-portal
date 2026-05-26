import { Card, StatusPill, PrimaryBtn } from '../components/ui'
import { SUPPLIERS, ACTIVE_PO, I18N } from '../mocks/data'

export function ProcurementPage() {
  const t = I18N.hu

  return (
    <div className="w-full px-7 py-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-8 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-stone-900">{t.proc.activePO}</div>
            <PrimaryBtn icon="plus">{t.proc.newPO}</PrimaryBtn>
          </div>
          <div className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
            <div className="truncate">ID</div>
            <div>Szállító</div>
            <div>Anyag</div>
            <div className="text-right">Db</div>
            <div>{t.common.eta}</div>
            <div>Státusz</div>
          </div>
          {ACTIVE_PO.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60"
            >
              <div className="text-[11.5px] font-mono text-stone-500 truncate">{p.id}</div>
              <div className="text-[12.5px] font-medium text-stone-900 truncate">{p.supplier}</div>
              <div className="text-[12px] text-stone-600 truncate">{p.material}</div>
              <div className="text-[12px] tabular-nums text-right">{p.qty}</div>
              <div className="text-[11.5px] font-mono text-stone-500">{p.eta}</div>
              <div className="min-w-0">
                <StatusPill status={p.status} label={t.status[p.status]} />
              </div>
            </div>
          ))}
        </Card>

        <Card className="col-span-4 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 text-[12.5px] font-semibold text-stone-900">
            {t.proc.suppliers}
          </div>
          {SUPPLIERS.map((s) => (
            <div key={s.name} className="px-5 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-stone-900 truncate">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.city}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-medium text-amber-600 tabular-nums">★ {s.rating}</div>
                  <div className="text-[10.5px] text-stone-500 tabular-nums">{s.reliability}% megbízhatóság</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10.5px] text-stone-400 font-mono">
                {t.proc.lastOrder}: {s.lastOrder}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

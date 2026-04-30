import { Card, StatusPill, PrimaryBtn } from '../components/ui'
import { SUPPLIERS, ACTIVE_PO, I18N } from '../mocks/data'

export function ProcurementPage() {
  const t = I18N.hu

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-stone-900">{t.proc.title}</h2>
          <p className="text-[12px] text-stone-500 mt-0.5">{t.proc.sub}</p>
        </div>
        <PrimaryBtn icon="plus">{t.proc.newPO}</PrimaryBtn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">{t.proc.suppliers}</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {SUPPLIERS.map((s) => (
              <div key={s.name} className="px-5 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-stone-500">{t.proc.rating}: {s.rating}/5</div>
                  <div className="text-[11px] text-stone-500">{t.proc.reliability}: {s.reliability}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">{t.proc.activePO}</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {ACTIVE_PO.map((po) => (
              <div key={po.id} className="px-5 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900">{po.id}</div>
                  <div className="text-[11px] text-stone-500">{po.supplier} &middot; {po.material}</div>
                </div>
                <div className="text-[11px] text-stone-500">{po.qty} db &middot; ETA: {po.eta}</div>
                <StatusPill status={po.status} label={I18N.hu.status[po.status]} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

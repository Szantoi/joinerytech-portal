import { useState } from 'react'
import { Card, StatusPill, ProgressBar } from '../components/ui'
import { MATERIALS, I18N } from '../mocks/data'

type InvTab = 'materials' | 'offcuts' | 'movements'

export function InventoryPage() {
  const t = I18N.hu
  const [tab, setTab] = useState<InvTab>('materials')

  const tabs: Array<{ key: InvTab; label: string }> = [
    { key: 'materials', label: t.inv.onHand },
    { key: 'offcuts', label: t.inv.offcuts },
    { key: 'movements', label: t.inv.movements },
  ]

  return (
    <div className="p-7 space-y-5">
      <div>
        <h2 className="text-[18px] font-semibold text-stone-900">{t.inv.title}</h2>
        <p className="text-[12px] text-stone-500 mt-0.5">{t.inv.sub}</p>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition ${
              tab === tb.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/60">
                {['Anyag', 'Kód', 'Készlet', 'Min.', 'Egységár', 'Állapot'].map((col) => (
                  <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {MATERIALS.map((m) => (
                <tr key={m.code} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{m.name}</td>
                  <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{m.code}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-medium text-stone-900">{m.onHand} {m.unit}</span>
                      <ProgressBar value={m.onHand} max={m.min * 3} tone={m.onHand < m.min ? 'rose' : 'teal'} className="w-16" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-stone-500">{m.min} {m.unit}</td>
                  <td className="px-5 py-3 text-[12px] text-stone-700">{m.price.toLocaleString('hu-HU')} Ft</td>
                  <td className="px-5 py-3">
                    <StatusPill status={m.trend} label={t.status[m.trend]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'offcuts' && (
        <Card className="p-8 text-center">
          <div className="text-[14px] text-stone-500">Maradék nyilvántartás hamarosan</div>
        </Card>
      )}

      {tab === 'movements' && (
        <Card className="p-8 text-center">
          <div className="text-[14px] text-stone-500">Anyagmozgás napló hamarosan</div>
        </Card>
      )}
    </div>
  )
}

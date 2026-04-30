import { useState } from 'react'
import { Card } from '../ui/Card'
import { TemplatesPanel } from './TemplatesPanel'
import { CATALOG_MATERIALS, type CatalogMaterial } from '../../mocks/extra'

function fmtHUF(n: number): string {
  return n.toLocaleString('hu-HU') + ' Ft'
}

type CatalogTab = 'materials' | 'templates' | 'edges' | 'hardware'

const TABS: Array<{ k: CatalogTab; label: string }> = [
  { k: 'materials', label: 'Anyagok' },
  { k: 'templates', label: 'Sablonok' },
  { k: 'edges', label: 'Élzárók' },
  { k: 'hardware', label: 'Vasalatok' },
]

export function CatalogPanel() {
  const [tab, setTab] = useState<CatalogTab>('materials')

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 bg-white border border-stone-200 rounded-lg p-0.5 w-fit">
        {TABS.map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`px-3 h-7 rounded-md text-[12px] font-medium ${
              tab === x.k ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <Card className="p-0">
          <div className="grid grid-cols-[1fr_180px_140px_120px_120px_100px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
            <div>Név</div>
            <div>Vastagságok</div>
            <div>Méret</div>
            <div className="text-right">Ár / tábla</div>
            <div>Szállító</div>
            <div>Aktív</div>
          </div>
          {CATALOG_MATERIALS.map((m: CatalogMaterial) => (
            <div
              key={m.name}
              className="grid grid-cols-[1fr_180px_140px_120px_120px_100px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60"
            >
              <div className="text-[12.5px] font-medium text-stone-900">{m.name}</div>
              <div className="flex gap-1 flex-wrap">
                {m.thicknesses.map((th: string) => (
                  <span key={th} className="text-[10.5px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                    {th}
                  </span>
                ))}
              </div>
              <div className="text-[11.5px] font-mono text-stone-600">{m.sizes}</div>
              <div className="text-[12px] text-right tabular-nums">{fmtHUF(m.price)}</div>
              <div className="text-[12px] text-stone-700">{m.supplier}</div>
              <div>
                <span className="inline-block w-8 h-4 bg-teal-600 rounded-full relative">
                  <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'templates' && <TemplatesPanel />}

      {tab === 'edges' && (
        <Card className="p-8 text-center text-[12px] text-stone-500">
          Élzáró katalógus (ABS, PVC, melamin) — hamarosan
        </Card>
      )}

      {tab === 'hardware' && (
        <Card className="p-8 text-center text-[12px] text-stone-500">
          Vasalat katalógus (Blum, Hettich) — hamarosan
        </Card>
      )}
    </div>
  )
}

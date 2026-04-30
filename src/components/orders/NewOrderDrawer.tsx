import { useState } from 'react'
import { SlideOver } from '../ui/SlideOver'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { CATALOG_MATERIALS, type CatalogMaterial } from '../../mocks/extra'

const CUSTOMERS = [
  'Bognár Bútor Kft.',
  'Várdai Konyhastúdió',
  'Kiss Lakberendezés',
  'Helios Faipar Zrt.',
  'Új ügyfél…',
]

const ORDER_TYPES = [
  { k: 'door', label: 'Ajtó' },
  { k: 'cabinet', label: 'Szekrény' },
  { k: 'window', label: 'Ablak' },
  { k: 'custom', label: 'Egyedi' },
]

interface NewOrderDrawerProps {
  open: boolean
  onClose: () => void
}

export function NewOrderDrawer({ open, onClose }: NewOrderDrawerProps) {
  const [customer, setCustomer] = useState('')
  const [type, setType] = useState('cabinet')
  const [dims, setDims] = useState('')
  const [due, setDue] = useState('')
  const [showAdv, setShowAdv] = useState(false)
  const [material, setMaterial] = useState('Bükk 18mm')
  const [edge, setEdge] = useState('ABS 2mm színazonos')
  const [finish, setFinish] = useState('Lakkozott')
  const [note, setNote] = useState('')
  const [showSugg, setShowSugg] = useState(false)

  const matches =
    customer.length === 0
      ? CUSTOMERS.slice(0, 4)
      : CUSTOMERS.filter((c) => c.toLowerCase().includes(customer.toLowerCase()))

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Új rendelés"
      subtitle="JT-2426-0185 · vázlat"
      width={560}
      footer={
        <>
          <GhostBtn onClick={onClose}>Mégse</GhostBtn>
          <GhostBtn icon="check" onClick={onClose}>
            Mentés vázlatként
          </GhostBtn>
          <PrimaryBtn icon="sparkle" onClick={onClose}>
            Mentés és számítás
          </PrimaryBtn>
        </>
      }
    >
      <div className="px-5 py-4 space-y-5">
        {/* Customer autocomplete */}
        <div className="relative">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Megrendelő</div>
          <div className="relative">
            <input
              value={customer}
              onChange={(e) => {
                setCustomer(e.target.value)
                setShowSugg(true)
              }}
              onFocus={() => setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 120)}
              placeholder="Kezdj el gépelni…"
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            <Icon name="search" size={14} className="absolute right-3 top-3 text-stone-400" />
          </div>
          {showSugg && matches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {matches.map((c, i) => (
                <button
                  key={i}
                  onMouseDown={() => {
                    setCustomer(c)
                    setShowSugg(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-[12.5px] hover:bg-stone-50 border-b border-stone-100 last:border-0"
                >
                  <div className="text-stone-900">{c}</div>
                  {c !== 'Új ügyfél…' && (
                    <div className="text-[10.5px] text-stone-500">aktív partner</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Típus</div>
          <div className="grid grid-cols-4 gap-1.5">
            {ORDER_TYPES.map((x) => (
              <button
                key={x.k}
                onClick={() => setType(x.k)}
                className={`h-9 rounded-lg text-[12px] border transition ${
                  type === x.k
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimensions + due */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Méretek</div>
            <input
              value={dims}
              onChange={(e) => setDims(e.target.value)}
              placeholder="pl. 600×720×560 mm"
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Határidő</div>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-[12.5px] font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Advanced expander */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAdv((s) => !s)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-stone-50 text-left"
          >
            <div>
              <div className="text-[12.5px] font-medium text-stone-900">Részletes specifikáció</div>
              <div className="text-[10.5px] text-stone-500">Anyag, élzárás, felület, megjegyzés, csatolmány</div>
            </div>
            <Icon
              name="chevron"
              size={14}
              className={`text-stone-400 transition ${showAdv ? 'rotate-90' : ''}`}
            />
          </button>
          {showAdv && (
            <div className="px-4 py-4 space-y-4 border-t border-stone-200 bg-stone-50/40">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Anyag</div>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12.5px] bg-white"
                >
                  {CATALOG_MATERIALS.flatMap((m: CatalogMaterial) =>
                    m.thicknesses.map((th: string) => (
                      <option key={m.name + th}>
                        {m.name.replace(' tábla', '')} {th}
                      </option>
                    )),
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Élzárás</div>
                  <select
                    value={edge}
                    onChange={(e) => setEdge(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12.5px] bg-white"
                  >
                    <option>ABS 2mm színazonos</option>
                    <option>ABS 1mm színazonos</option>
                    <option>PVC 2mm</option>
                    <option>Melamin 0.4mm</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">
                    Felületkezelés
                  </div>
                  <select
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12.5px] bg-white"
                  >
                    <option>Lakkozott</option>
                    <option>Olajos lazúr</option>
                    <option>Nyers</option>
                    <option>Fóliázott</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Megjegyzés</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Pl. fiókok belül melamin fehér, hátlap CPL"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[12.5px] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                />
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Csatolmány</div>
                <div className="border-2 border-dashed border-stone-200 rounded-lg px-4 py-5 text-center hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer transition">
                  <Icon name="download" size={18} className="text-stone-400 mx-auto" />
                  <div className="text-[11.5px] text-stone-600 mt-1">
                    Húzd ide a fájlt vagy{' '}
                    <span className="text-teal-700 font-medium">tallózz</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-mono">DXF · DWG · PDF · 3DM · max 25 MB</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

import { Icon } from '../ui'
import type { HardwareSpecItem } from '../../types/joinery.types'

interface HardwareSpecsCardProps {
  specs: HardwareSpecItem[]
  loading: boolean
  isMock?: boolean
}

const SPEC_LABELS: Record<HardwareSpecItem['spec'], { icon: string; label: string }> = {
  'edge-banding': { icon: 'layers', label: 'Élzárás' },
  'hinge': { icon: 'settings', label: 'Zsanér' },
  'lacquer': { icon: 'paint', label: 'Lakk' },
  'stain': { icon: 'droplet', label: 'Lazúr/Pác' },
}

export function HardwareSpecsCard({ specs, loading, isMock }: HardwareSpecsCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-stone-200/70 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <span className="text-[12px] text-stone-500">Specifikáció betöltése...</span>
        </div>
      </div>
    )
  }

  if (specs.length === 0) {
    return (
      <div className="bg-white border border-stone-200/70 rounded-lg p-6">
        <div className="text-center text-[12px] text-stone-400">
          Nincs specifikáció adat
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200/70 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[11.5px] font-semibold text-stone-900">Vasalat / Felület specifikáció</div>
          {isMock && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              Mock
            </span>
          )}
        </div>
        <span className="text-[10.5px] text-emerald-700 inline-flex items-center gap-1">
          <Icon name="check" size={10} />generálva
        </span>
      </div>

      <div className="space-y-2">
        {specs.map((spec, idx) => {
          const specInfo = SPEC_LABELS[spec.spec]
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-2 bg-stone-50/60 rounded-lg"
            >
              <div className="w-7 h-7 rounded-md bg-stone-200/70 flex items-center justify-center text-stone-600">
                <Icon name={specInfo?.icon ?? 'box'} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-stone-500">{specInfo?.label ?? spec.spec}</div>
                <div className="text-[12px] font-medium text-stone-900 truncate">{spec.value}</div>
              </div>
              <div className="text-[11px] text-stone-500 tabular-nums shrink-0">
                {spec.quantity} {spec.spec === 'edge-banding' ? 'm' : 'db'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

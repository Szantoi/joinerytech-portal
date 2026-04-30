import { Card } from '../ui/Card'
import { Icon } from '../ui/Icon'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { STAGES } from '../../mocks/extra'

export function StageChainEditor() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-semibold text-stone-900">Doorstar StageChain</div>
          <div className="text-[11px] text-stone-500">
            {STAGES.length} szakasz · workflow konfiguráció
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GhostBtn icon="plus">Szakasz hozzáadása</GhostBtn>
          <PrimaryBtn icon="check">Mentés</PrimaryBtn>
        </div>
      </div>

      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <Card className="p-4 w-44">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-md grid place-items-center text-[11px] font-bold ${
                    s.optional
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                >
                  {i + 1}
                </div>
                {s.optional && (
                  <span className="text-[9px] text-stone-400 uppercase tracking-wide">opt</span>
                )}
              </div>
              <div className="text-[12.5px] font-semibold text-stone-900">{s.hu}</div>
              <div className="text-[10.5px] text-stone-500 mt-0.5">{s.en}</div>
              <div className="mt-3 flex items-center gap-1">
                <button className="text-[10px] px-1.5 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600">
                  Szerkeszt
                </button>
                {!s.optional && (
                  <button className="text-[10px] px-1.5 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600">
                    Opt.
                  </button>
                )}
              </div>
            </Card>
            {i < STAGES.length - 1 && (
              <Icon name="chevron" size={16} className="text-stone-300 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <Card className="p-4 bg-stone-50/60">
        <div className="text-[11.5px] text-stone-600">
          <span className="font-semibold text-stone-900">Doorstar workflow:</span> az ügyfél megrendelés az
          Értékesítési szakaszból indítva, Felmérésen (opcionális), Gyártáson, Szállításon, majd Beszerelésen
          halad át. A StageChain konfiguráció meghatározza a kötelező kézbesítési pontokat és handoffokat.
        </div>
      </Card>
    </div>
  )
}

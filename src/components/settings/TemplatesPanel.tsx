import { useState } from 'react'
import { SlideOver } from '../ui/SlideOver'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { TEMPLATES } from '../../mocks/extra2'
import type { Template } from '../../types'

const TPL_TYPE_TONE: Record<string, string> = {
  door: 'bg-amber-50 text-amber-700',
  cabinet: 'bg-teal-50 text-teal-700',
  window: 'bg-sky-50 text-sky-700',
}

const TPL_TYPE_LABELS: Record<string, string> = {
  door: 'Ajtó',
  cabinet: 'Szekrény',
  window: 'Ablak',
}

function TemplatePreviewSVG({ type }: { type: string }) {
  const common = {
    width: '100%' as const,
    height: '100%' as const,
    viewBox: '0 0 120 90',
    preserveAspectRatio: 'xMidYMid meet',
  }

  if (type === 'door') {
    return (
      <svg {...common}>
        <rect x="40" y="10" width="40" height="70" rx="2" fill="#f5f5f4" stroke="#a8a29e" />
        <rect x="46" y="16" width="28" height="28" rx="1" fill="#fff" stroke="#a8a29e" strokeWidth={0.5} />
        <rect x="46" y="48" width="28" height="28" rx="1" fill="#fff" stroke="#a8a29e" strokeWidth={0.5} />
        <circle cx="71" cy="45" r="1.5" fill="#0d9488" />
      </svg>
    )
  }
  if (type === 'window') {
    return (
      <svg {...common}>
        <rect x="22" y="20" width="76" height="50" rx="1" fill="#e0f2fe" stroke="#0369a1" />
        <line x1="60" y1="20" x2="60" y2="70" stroke="#0369a1" />
        <line x1="22" y1="45" x2="98" y2="45" stroke="#0369a1" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="20" y="15" width="80" height="60" rx="1.5" fill="#f5f5f4" stroke="#a8a29e" />
      <rect x="24" y="19" width="36" height="52" fill="#fff" stroke="#a8a29e" strokeWidth={0.5} />
      <rect x="62" y="19" width="34" height="25" fill="#fff" stroke="#a8a29e" strokeWidth={0.5} />
      <rect x="62" y="46" width="34" height="25" fill="#fff" stroke="#a8a29e" strokeWidth={0.5} />
      <circle cx="42" cy="45" r="1.2" fill="#0d9488" />
      <circle cx="92" cy="32" r="1.2" fill="#0d9488" />
      <circle cx="92" cy="58" r="1.2" fill="#0d9488" />
    </svg>
  )
}

function TemplateCard({ t, onOpen }: { t: Template; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(t.id)}
      className="text-left bg-white border border-stone-200/80 hover:border-stone-300 rounded-xl overflow-hidden transition group"
    >
      <div className="aspect-[4/2.6] bg-stone-50 border-b border-stone-100 grid place-items-center p-3">
        <div className="w-full h-full">
          <TemplatePreviewSVG type={t.type} />
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[12.5px] font-semibold text-stone-900 truncate flex-1">{t.name}</div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TPL_TYPE_TONE[t.type] ?? 'bg-stone-100 text-stone-600'}`}
          >
            {TPL_TYPE_LABELS[t.type] ?? t.type}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2.5 text-[10.5px] text-stone-500">
          <span className="font-mono">{t.paramCount} param</span>
          <span>·</span>
          <span className="text-amber-600">★ {t.rating}</span>
          {t.community && (
            <>
              <span>·</span>
              <span className="font-mono">{t.downloads} ↓</span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

export function TemplatesPanel() {
  const [openId, setOpenId] = useState<string | null>(null)
  const tpl = TEMPLATES.find((t) => t.id === openId) ?? null

  const own = TEMPLATES.filter((t) => !t.community)
  const community = TEMPLATES.filter((t) => t.community)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[12.5px] font-semibold text-stone-900">Saját parametrikus sablonok</div>
            <div className="text-[10.5px] text-stone-500">Cabinet 0.3 specifikáció · CNC deriválás támogatva</div>
          </div>
          <PrimaryBtn icon="plus">Új sablon</PrimaryBtn>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {own.map((t) => (
            <TemplateCard key={t.id} t={t} onOpen={setOpenId} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[12.5px] font-semibold text-stone-900 inline-flex items-center gap-2">
              Community katalógus{' '}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">béta</span>
            </div>
            <div className="text-[10.5px] text-stone-500">Megosztott sablonok más JoineryTech felhasználóktól</div>
          </div>
          <GhostBtn icon="external">Tallózás</GhostBtn>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {community.map((t) => (
            <TemplateCard key={t.id} t={t} onOpen={setOpenId} />
          ))}
        </div>
      </div>

      <SlideOver
        open={!!tpl}
        onClose={() => setOpenId(null)}
        title={tpl?.name ?? ''}
        subtitle={tpl ? `${TPL_TYPE_LABELS[tpl.type] ?? tpl.type} · ${tpl.paramCount} paraméter` : undefined}
        width={500}
        footer={
          <>
            <GhostBtn onClick={() => setOpenId(null)}>Bezár</GhostBtn>
            <PrimaryBtn icon="sparkle">Példányosítás</PrimaryBtn>
          </>
        }
      >
        {tpl && (
          <div className="px-5 py-4 space-y-4">
            <div className="aspect-[4/2.4] bg-stone-50 border border-stone-200 rounded-lg p-6 grid place-items-center">
              <div className="w-full h-full max-w-[280px]">
                <TemplatePreviewSVG type={tpl.type} />
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">Paraméterek</div>
              {tpl.params ? (
                <div className="space-y-1">
                  {tpl.params.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_120px_60px] gap-2 items-center px-3 py-1.5 rounded-md bg-stone-50 border border-stone-100"
                    >
                      <div className="text-[12px] text-stone-800">{p.name}</div>
                      <input
                        defaultValue={String(p.val)}
                        className="h-7 px-2 rounded border border-stone-200 text-[11.5px] font-mono bg-white"
                      />
                      <div className="text-[10.5px] text-stone-500 font-mono">{p.unit}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-stone-400 italic">
                  Paraméterek a példányosítás során válnak elérhetővé
                </div>
              )}
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
                CNC deriválás előnézet
              </div>
              <div className="bg-stone-900 rounded-lg p-3 text-[10.5px] font-mono text-teal-300 leading-relaxed">
                <div className="text-stone-400">{'// Generált G-kód kivonat'}</div>
                <div>G21 G90 G94 ; mm, abs, mm/min</div>
                <div>T1 M6 ; D=8mm fúró</div>
                <div>G0 X32 Y96 Z5</div>
                <div>G1 Z-13 F600</div>
                <div className="text-stone-400">; ... +84 sor</div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

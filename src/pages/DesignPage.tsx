import { useState } from 'react'
import { Card, PrimaryBtn, Icon } from '../components/ui'
import { PARAM_TEMPLATES, CATALOG_LOOKUP } from '../mocks/worlds'
import { TEMPLATES } from '../mocks/extra2'

type DesignTab = 'templates' | 'editor' | 'catalog'

export function DesignPage() {
  const [tab, setTab] = useState<DesignTab>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const tabs: Array<{ key: DesignTab; label: string }> = [
    { key: 'templates', label: 'Sablonok' },
    { key: 'editor', label: 'Szerkesztő' },
    { key: 'catalog', label: 'Katalógus' },
  ]

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-semibold text-stone-900">Tervezés</h2>
        <PrimaryBtn icon="plus">Új sablon</PrimaryBtn>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition ${
              tab === t.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="p-5"
              interactive
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-stone-900">{tmpl.name}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{tmpl.type} &middot; {tmpl.paramCount} paraméter</div>
                </div>
                {tmpl.community && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">Közösségi</span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-amber-600">
                  {'★'.repeat(Math.round(tmpl.rating))}
                  <span className="text-stone-500 ml-1">{tmpl.rating}</span>
                </div>
                <span className="text-stone-500">{tmpl.downloads} letöltés</span>
              </div>
              <button
                onClick={() => { setSelectedTemplate(tmpl.id); setTab('editor') }}
                className="mt-3 w-full text-center text-[12px] font-medium text-teal-700 hover:text-teal-900 py-1.5 border border-teal-200 rounded-lg hover:bg-teal-50 transition"
              >
                Megnyitás
              </button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'editor' && (
        <TemplateEditor templateId={selectedTemplate} />
      )}

      {tab === 'catalog' && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-[13px] font-semibold text-stone-900">Anyag katalógus</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {Object.entries(CATALOG_LOOKUP).map(([code, mat]) => (
              <div key={code} className="px-5 py-3 flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: mat.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-stone-900">{mat.name}</div>
                  <div className="text-[11px] text-stone-500">{mat.kind} &middot; {mat.t}mm</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function TemplateEditor({ templateId }: { templateId: string | null }) {
  const tmpl = PARAM_TEMPLATES.find((t) => t.id === templateId) ?? PARAM_TEMPLATES[0]
  const [vars, setVars] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {}
    tmpl.vars.forEach((v) => { init[v.key] = v.default })
    return init
  })

  function updateVar(key: string, val: number | string) {
    setVars((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-5 lg:col-span-1">
        <h3 className="text-[14px] font-semibold text-stone-900 mb-1">{tmpl.name}</h3>
        <p className="text-[11px] text-stone-500 mb-4">{tmpl.note}</p>
        <div className="space-y-3">
          {tmpl.vars.map((v) => (
            <div key={v.key}>
              <label className="text-[11px] text-stone-500 font-medium block mb-1">
                {v.label} {v.unit && `(${v.unit})`}
              </label>
              {v.kind === 'range' && (
                <input
                  type="range"
                  min={v.min}
                  max={v.max}
                  step={v.step}
                  value={Number(vars[v.key])}
                  onChange={(e) => updateVar(v.key, Number(e.target.value))}
                  className="w-full"
                />
              )}
              {v.kind === 'select' && v.options && (
                <select
                  value={String(vars[v.key])}
                  onChange={(e) => updateVar(v.key, e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-stone-200 text-[12px]"
                >
                  {v.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {v.kind !== 'range' && v.kind !== 'select' && (
                <input
                  type="number"
                  value={Number(vars[v.key])}
                  onChange={(e) => updateVar(v.key, Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-lg border border-stone-200 text-[12px]"
                />
              )}
              <div className="text-[10px] text-stone-400 mt-0.5">{String(vars[v.key])}{v.unit ? ` ${v.unit}` : ''}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h3 className="text-[13px] font-semibold text-stone-900 mb-3">Alkatrészlista</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-stone-200/60">
                <th className="py-2 pr-4 text-stone-500 font-medium">Név</th>
                <th className="py-2 pr-4 text-stone-500 font-medium">Db</th>
                <th className="py-2 pr-4 text-stone-500 font-medium">Anyag</th>
                <th className="py-2 pr-4 text-stone-500 font-medium">Szél.</th>
                <th className="py-2 pr-4 text-stone-500 font-medium">Mag.</th>
                <th className="py-2 text-stone-500 font-medium">Vast.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tmpl.parts.map((p, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 font-medium text-stone-900">{p.name}</td>
                  <td className="py-2 pr-4 text-stone-700">{p.qty}</td>
                  <td className="py-2 pr-4 text-stone-500">{p.mat}</td>
                  <td className="py-2 pr-4 text-stone-700">{p.w}</td>
                  <td className="py-2 pr-4 text-stone-700">{p.h}</td>
                  <td className="py-2 text-stone-700">{p.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Icon name="alert" size={14} className="text-amber-600" />
          <span className="text-[11px] text-stone-500">
            {tmpl.constraints.length} korlát aktív
          </span>
        </div>
      </Card>
    </div>
  )
}

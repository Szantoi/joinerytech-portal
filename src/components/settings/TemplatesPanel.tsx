import { useState, useEffect } from 'react'
import { SlideOver } from '../ui/SlideOver'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Card } from '../ui/Card'
import { useApi, API_BASE } from '../../hooks/useApi'

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateDto {
  id: string
  name: string
  tradeType: string
  parameterCount: number
  slotCount: number
  isActive: boolean
}

export interface TemplateParamDto {
  key: string
  value: string
  description: string
}

export interface TemplateDetailDto extends TemplateDto {
  parameters: TemplateParamDto[]
  graphJson?: string
}

interface PagedTemplates {
  items: TemplateDto[]
  totalCount: number
}

// ── Fallback mock data ────────────────────────────────────────────────────────

export const TEMPLATES_FALLBACK: TemplateDto[] = [
  { id: 'tpl-001', name: 'Standard ajtó sablon', tradeType: 'door',    parameterCount: 14, slotCount: 3, isActive: true },
  { id: 'tpl-002', name: 'Toló ajtó sablon',     tradeType: 'door',    parameterCount: 10, slotCount: 2, isActive: true },
  { id: 'tpl-003', name: 'Konyhai szekrény',      tradeType: 'cabinet', parameterCount: 18, slotCount: 5, isActive: true },
  { id: 'tpl-004', name: 'Gardrób alap',          tradeType: 'cabinet', parameterCount: 12, slotCount: 4, isActive: false },
  { id: 'tpl-005', name: 'Nyílászáró sablon',     tradeType: 'window',  parameterCount: 8,  slotCount: 2, isActive: true },
]

const DETAIL_FALLBACK: Record<string, TemplateDetailDto> = {
  'tpl-001': {
    id: 'tpl-001', name: 'Standard ajtó sablon', tradeType: 'door',
    parameterCount: 14, slotCount: 3, isActive: true,
    parameters: [
      { key: 'width_mm',     value: '900',       description: 'Ajtólap szélessége mm-ben' },
      { key: 'height_mm',    value: '2100',      description: 'Ajtólap magassága mm-ben' },
      { key: 'thickness_mm', value: '40',        description: 'Ajtólap vastagsága mm-ben' },
      { key: 'material',     value: 'MDF',       description: 'Alapanyag típusa' },
      { key: 'finish',       value: 'Lakkozott', description: 'Felületkezelés' },
    ],
    graphJson: '{"nodes":[{"id":"door","type":"parametric","params":{"w":900,"h":2100}}],"edges":[]}',
  },
  'tpl-002': {
    id: 'tpl-002', name: 'Toló ajtó sablon', tradeType: 'door',
    parameterCount: 10, slotCount: 2, isActive: true,
    parameters: [
      { key: 'panel_width',  value: '800',  description: 'Tolólap szélessége' },
      { key: 'panel_height', value: '2000', description: 'Tolólap magassága' },
      { key: 'track_type',   value: 'top',  description: 'Sínrendszer típusa (top/bottom/both)' },
    ],
    graphJson: '{"nodes":[{"id":"slide","type":"sliding"}],"edges":[]}',
  },
}

function getFallbackDetail(id: string): TemplateDetailDto {
  return DETAIL_FALLBACK[id] ?? {
    ...(TEMPLATES_FALLBACK.find((t) => t.id === id) ?? TEMPLATES_FALLBACK[0]),
    parameters: [
      { key: 'param_1', value: 'érték_1', description: 'Paraméter leírása' },
      { key: 'param_2', value: 'érték_2', description: 'Paraméter leírása' },
    ],
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRADE_LABEL: Record<string, string> = {
  door:    'Ajtó',
  cabinet: 'Szekrény',
  window:  'Ablak',
  custom:  'Egyedi',
}

const TRADE_BADGE: Record<string, string> = {
  door:    'bg-amber-50 text-amber-700',
  cabinet: 'bg-teal-50 text-teal-700',
  window:  'bg-sky-50 text-sky-700',
  custom:  'bg-stone-100 text-stone-600',
}

function tradeBadgeCls(tradeType: string) {
  return TRADE_BADGE[tradeType] ?? TRADE_BADGE.custom
}

// ── Detail SlideOver ──────────────────────────────────────────────────────────

function TemplateDetailSlideOver({ templateId, onClose }: { templateId: string | null; onClose: () => void }) {
  const url = templateId ? `${API_BASE.abstractions}/api/modules/templates/${templateId}` : null
  const { data: apiDetail, refetch } = useApi<TemplateDetailDto>(url)

  useEffect(() => { if (templateId) refetch() }, [templateId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!templateId) return null

  const detail = apiDetail ?? getFallbackDetail(templateId)

  return (
    <SlideOver
      open={true}
      onClose={onClose}
      title={detail.name}
      subtitle={`${TRADE_LABEL[detail.tradeType] ?? detail.tradeType} · ${detail.parameterCount} paraméter · ${detail.slotCount} slot`}
      width={520}
      footer={
        <>
          <GhostBtn onClick={onClose}>Bezárás</GhostBtn>
          <PrimaryBtn icon="sparkle">Példányosítás</PrimaryBtn>
        </>
      }
    >
      <div className="px-5 py-4 space-y-5">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${
            detail.isActive ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
          }`}>
            {detail.isActive ? 'Aktív' : 'Inaktív'}
          </span>
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${tradeBadgeCls(detail.tradeType)}`}>
            {TRADE_LABEL[detail.tradeType] ?? detail.tradeType}
          </span>
          <span className="text-[10.5px] font-mono text-stone-400">{detail.id}</span>
        </div>

        {/* Params table */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
            Paraméterek ({detail.parameters.length})
          </div>
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-3 py-2 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Kulcs</th>
                  <th className="px-3 py-2 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Érték</th>
                  <th className="px-3 py-2 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Leírás</th>
                </tr>
              </thead>
              <tbody>
                {detail.parameters.map((p, i) => (
                  <tr key={i} className="border-b border-stone-100 last:border-0">
                    <td className="px-3 py-2 font-mono text-stone-700">{p.key}</td>
                    <td className="px-3 py-2 font-mono text-teal-700">{p.value}</td>
                    <td className="px-3 py-2 text-stone-500">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Graph JSON */}
        {detail.graphJson && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-2">
              Graph JSON előnézet
            </div>
            <pre className="bg-stone-900 text-stone-100 rounded-lg p-3 font-mono text-[10.5px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
              {detail.graphJson}
            </pre>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Paraméterszám</div>
            <div className="text-[17px] font-semibold text-stone-900 mt-0.5">{detail.parameterCount}</div>
          </div>
          <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Slotok száma</div>
            <div className="text-[17px] font-semibold text-stone-900 mt-0.5">{detail.slotCount}</div>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}

// ── TemplatesPanel ────────────────────────────────────────────────────────────

export function TemplatesPanel() {
  const { data: apiData, refetch } = useApi<PagedTemplates | TemplateDto[]>(
    `${API_BASE.abstractions}/api/modules/templates`
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { refetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const raw = apiData
    ? Array.isArray(apiData) ? apiData : (apiData as PagedTemplates).items
    : null
  const templates = raw ?? TEMPLATES_FALLBACK

  return (
    <>
      <Card className="p-0">
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-stone-900">
            Parametrikus sablonok
            <span className="ml-2 text-[11px] text-stone-400 font-normal">({templates.length})</span>
          </div>
          <PrimaryBtn icon="plus">Új sablon</PrimaryBtn>
        </div>

        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60">
              <th className="px-5 py-2.5 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Név</th>
              <th className="px-4 py-2.5 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Típus</th>
              <th className="px-4 py-2.5 text-right text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Paraméterek</th>
              <th className="px-4 py-2.5 text-right text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Slotok</th>
              <th className="px-5 py-2.5 text-left text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Státusz</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 cursor-pointer"
              >
                <td className="px-5 py-3 font-medium text-stone-900">{t.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10.5px] px-2 py-0.5 rounded font-medium ${tradeBadgeCls(t.tradeType)}`}>
                    {TRADE_LABEL[t.tradeType] ?? t.tradeType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-stone-600">{t.parameterCount}</td>
                <td className="px-4 py-3 text-right font-mono text-stone-600">{t.slotCount}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${
                    t.isActive ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {t.isActive ? 'Aktív' : 'Inaktív'}
                  </span>
                </td>
                <td className="pr-3">
                  <Icon name="chevron" size={14} className="text-stone-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {templates.length === 0 && (
          <div className="px-5 py-8 text-center text-[12px] text-stone-500">Nincs sablon</div>
        )}
      </Card>

      <TemplateDetailSlideOver
        templateId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}

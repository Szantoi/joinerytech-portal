import { useState } from 'react'
import { Card, StatusPill, PrimaryBtn } from '../components/ui'
import { QUOTES, CUSTOMERS, QUOTE_TONE } from '../mocks/worlds'
import { I18N } from '../mocks/data'
import { fmtHUF } from '../lib/utils'
import type { QuoteStatus } from '../types'

type SalesTab = 'pipeline' | 'quotes' | 'customers'

export function SalesPage() {
  const [tab, setTab] = useState<SalesTab>('pipeline')

  const tabs: Array<{ key: SalesTab; label: string }> = [
    { key: 'pipeline', label: 'Értékesítési pipeline' },
    { key: 'quotes', label: 'Ajánlatok' },
    { key: 'customers', label: 'Ügyfelek' },
  ]

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-semibold text-stone-900">Értékesítés</h2>
        <PrimaryBtn icon="plus">Új ajánlat</PrimaryBtn>
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

      {tab === 'pipeline' && <SalesPipeline />}
      {tab === 'quotes' && <SalesQuotes />}
      {tab === 'customers' && <SalesCustomers />}
    </div>
  )
}

function SalesPipeline() {
  const t = I18N.hu
  const stages: QuoteStatus[] = ['draft', 'sent', 'approved', 'rejected']
  const stageLabels: Record<QuoteStatus, string> = {
    draft: 'Piszkozat',
    sent: 'Elküldve',
    approved: 'Elfogadva',
    rejected: 'Elutasítva',
    expired: 'Lejárt',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const items = QUOTES.filter((q) => q.status === stage)
        const tone = QUOTE_TONE[stage]
        return (
          <div key={stage}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
              <span className="text-[12px] font-semibold text-stone-700">{stageLabels[stage]}</span>
              <span className="text-[11px] text-stone-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((q) => (
                <Card key={q.id} className="p-3" interactive>
                  <div className="text-[12px] font-medium text-stone-900">{q.customer}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{q.id}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[12px] font-medium text-stone-800">{fmtHUF(q.value)}</span>
                    <StatusPill status={stage === 'approved' ? 'done' : stage === 'rejected' ? 'critical' : 'draft'} label={t.status[stage === 'approved' ? 'done' : stage === 'rejected' ? 'critical' : 'draft']} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SalesQuotes() {
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-stone-50/80 border-b border-stone-200/60">
            {['Azonosító', 'Ügyfél', 'Érték', 'Dátum', 'Lejárat', 'Állapot'].map((col) => (
              <th key={col} className="px-5 py-3 text-[11px] uppercase tracking-wide text-stone-500 font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {QUOTES.map((q) => (
            <tr key={q.id} className="hover:bg-stone-50/50">
              <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{q.id}</td>
              <td className="px-5 py-3 text-[12.5px] text-stone-700">{q.customer}</td>
              <td className="px-5 py-3 text-[12.5px] font-medium text-stone-900">{fmtHUF(q.value)}</td>
              <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{q.date}</td>
              <td className="px-5 py-3 text-[12px] text-stone-500 font-mono">{q.expires}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${QUOTE_TONE[q.status].bg} ${QUOTE_TONE[q.status].fg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${QUOTE_TONE[q.status].dot}`} />
                  {QUOTE_TONE[q.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function SalesCustomers() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {CUSTOMERS.map((c) => (
        <Card key={c.id} className="p-5" interactive>
          <div className="text-[14px] font-semibold text-stone-900">{c.name}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{c.city}</div>
          <div className="mt-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-stone-500">Kontakt</span>
              <span className="text-stone-700">{c.contact}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Nyitott</span>
              <span className="text-stone-700">{c.openOrders} megrendelés</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">LTV</span>
              <span className="font-medium text-stone-900">{fmtHUF(c.ltv)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

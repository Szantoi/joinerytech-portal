import { useEffect } from 'react'
import { SlideOver, GhostBtn } from '../ui'
import { useApi, API_BASE } from '../../hooks/useApi'
import { getMockSupplierDetail, PO_STATUS_STYLE, type SupplierDetailDto } from '../../data/data-procurement'

interface ApiSupplierDetail {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  leadTimeDays: number
  rating: number
}

interface Props {
  open: boolean
  supplierId?: string
  supplierName: string
  onClose: () => void
}

const SECTION = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2'

export function SupplierSlideOver({ open, supplierId, supplierName, onClose }: Props) {
  const { data: apiData, refetch } = useApi<ApiSupplierDetail>(
    supplierId ? `${API_BASE.procurement}/api/suppliers/${supplierId}` : null
  )
  useEffect(() => { if (open && supplierId) refetch() }, [open, supplierId]) // eslint-disable-line

  // Build display detail — API data merged with mock-generated extras
  const mock = getMockSupplierDetail(supplierName)
  const detail: SupplierDetailDto = apiData
    ? {
        ...mock,
        id: apiData.id,
        name: apiData.name,
        email: apiData.email,
        phone: apiData.phone,
        address: apiData.address,
        leadTimeDays: apiData.leadTimeDays || mock.leadTimeDays,
        rating: apiData.rating || mock.rating,
      }
    : mock

  const initials = detail.name.split(' ').slice(0, 2).map((s) => s[0]).join('')
  const maxTrend = Math.max(...detail.weeklyTrend, 1)

  // Active orders: use mock active order count for now
  const activeStatuses: Array<{ label: string; status: string }> = Array.from(
    { length: detail.activeOrderCount },
    (_, i) => ({
      label: `PO-2026-0${90 + i}`,
      status: i % 2 === 0 ? 'Approved' : 'Shipping',
    })
  )

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={detail.name}
      subtitle={detail.address ?? ''}
      width={500}
      footer={<GhostBtn onClick={onClose}>Bezárás</GhostBtn>}
    >
      <div className="px-5 py-4 space-y-5">

        {/* Avatar + header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[14px] font-semibold text-white shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-stone-900">{detail.name}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">{detail.address}</div>
          </div>
        </div>

        {/* KPI kártyák */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Értékelés', value: `★ ${detail.rating.toFixed(1)}`, sub: '5-ös skála' },
            { label: 'Megbízhatóság', value: `${detail.reliabilityPct}%`, sub: 'teljesítési arány' },
            { label: 'Lead time', value: `${detail.leadTimeDays} nap`, sub: 'átlag szállítás' },
          ].map((kpi) => (
            <div key={kpi.label} className="p-3 rounded-lg bg-stone-50 border border-stone-100 text-center">
              <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">{kpi.label}</div>
              <div className="text-[18px] font-semibold text-stone-900 mt-0.5">{kpi.value}</div>
              <div className="text-[9.5px] text-stone-400">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* 7-hetes megbízhatóság trend */}
        <div>
          <div className={SECTION}>7-hetes megbízhatóság trend</div>
          <div className="flex items-end gap-1 h-16">
            {detail.weeklyTrend.map((v, i) => {
              const h = Math.round((v / maxTrend) * 100)
              const isLow = v < 85
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t ${isLow ? 'bg-amber-400' : 'bg-teal-400'}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[8px] text-stone-400">{`W-${7 - i}`}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1 text-[9.5px] text-stone-400">
            <span>7 héttel ezelőtt</span>
            <span>Ma</span>
          </div>
        </div>

        {/* Kapcsolat */}
        <div>
          <div className={SECTION}>Kapcsolat</div>
          <dl className="space-y-1.5 text-[12px]">
            {detail.email && (
              <div className="flex gap-3"><dt className="text-stone-500 w-20 shrink-0">E-mail</dt><dd className="text-stone-700 font-mono">{detail.email}</dd></div>
            )}
            {detail.phone && (
              <div className="flex gap-3"><dt className="text-stone-500 w-20 shrink-0">Telefon</dt><dd className="text-stone-700 font-mono">{detail.phone}</dd></div>
            )}
            {detail.lastOrderDate && (
              <div className="flex gap-3"><dt className="text-stone-500 w-20 shrink-0">Utolsó rend.</dt><dd className="text-stone-900 font-mono">{detail.lastOrderDate}</dd></div>
            )}
          </dl>
        </div>

        {/* Aktív megrendelések */}
        <div>
          <div className={SECTION}>Aktív megrendelések ({activeStatuses.length})</div>
          {activeStatuses.length === 0 ? (
            <div className="text-[12px] text-stone-400">Nincs aktív megrendelés</div>
          ) : (
            <div className="space-y-1">
              {activeStatuses.map((o) => {
                const tone = PO_STATUS_STYLE[o.status] ?? PO_STATUS_STYLE.Submitted
                return (
                  <div key={o.label} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-stone-100">
                    <span className="text-[11.5px] font-mono text-stone-700 flex-1">{o.label}</span>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${tone.bg} ${tone.fg}`}>
                      {tone.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}

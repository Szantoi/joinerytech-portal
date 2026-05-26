import { useState, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { SlideOver } from '../ui/SlideOver'
import { PrimaryBtn, GhostBtn } from '../ui/Button'
import { FACILITIES } from '../../mocks/extra2'
import { useApi, API_BASE } from '../../hooks/useApi'
import { useAuth } from '../../auth'
import type { Facility } from '../../types'

interface ApiFacility {
  id: string
  name: string
  tenantId: string
}

interface FacilitiesPage {
  items: ApiFacility[]
  totalCount: number
}

function isRealFacility(name: string): boolean {
  return !name.startsWith('E2E') && !name.match(/^Fac\d/) && !name.match(/^Fac-/)
}

export function FacilitiesPanel() {
  const [openId, setOpenId] = useState<string | null>(null)
  const { tenantId } = useAuth()

  const { data: apiPage, refetch } = useApi<FacilitiesPage>(
    tenantId ? `${API_BASE.kernel}/tenants/${tenantId}/facilities?pageSize=100` : null
  )
  useEffect(() => { if (tenantId) refetch() }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  const realApiFacilities = apiPage?.items.filter(f => isRealFacility(f.name)) ?? null

  // Merge: API provides real facility list; mock provides rich details
  const displayFacilities = realApiFacilities && realApiFacilities.length > 0
    ? realApiFacilities.map(f => {
        const mock = FACILITIES.find(m => m.name === f.name) ?? FACILITIES[0]
        return { ...mock, id: f.id, name: f.name }
      })
    : FACILITIES

  const facility: Facility | undefined = displayFacilities.find((f) => f.id === openId) as Facility | undefined

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12.5px] text-stone-500">
          {displayFacilities.length} részleg ·{' '}
          {displayFacilities.reduce((a, f) => a + f.machines, 0)} gép ·{' '}
          {displayFacilities.reduce((a, f) => a + f.workers, 0)} dolgozó
        </div>
        <PrimaryBtn icon="plus">Új részleg</PrimaryBtn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayFacilities.map((f) => (
          <button
            key={f.id}
            onClick={() => setOpenId(f.id)}
            className="text-left bg-white border border-stone-200/80 hover:border-stone-300 rounded-xl p-4 transition"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 grid place-items-center">
                <Icon name="factory" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-stone-900 truncate">{f.name}</div>
                <div className="text-[11px] text-stone-500 truncate">{f.address}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className="bg-stone-50 rounded-md px-2.5 py-2">
                <div className="text-stone-500">Gépek</div>
                <div className="text-[16px] font-semibold tabular-nums text-stone-900">{f.machines}</div>
              </div>
              <div className="bg-stone-50 rounded-md px-2.5 py-2">
                <div className="text-stone-500">Dolgozók</div>
                <div className="text-[16px] font-semibold tabular-nums text-stone-900">{f.workers}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[10.5px] text-stone-500">
              <Icon name="user" size={11} />
              <span className="truncate">{f.contactName}</span>
            </div>
          </button>
        ))}
      </div>

      <SlideOver
        open={!!facility}
        onClose={() => setOpenId(null)}
        title={facility?.name ?? ''}
        subtitle={facility?.address}
        width={460}
        footer={
          <>
            <GhostBtn onClick={() => setOpenId(null)}>Bezár</GhostBtn>
            <PrimaryBtn icon="check">Mentés</PrimaryBtn>
          </>
        }
      >
        {facility && (
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Cím', v: facility.address },
                { l: 'Kapcsolattartó', v: facility.contactName },
                { l: 'Telefon', v: facility.contactPhone },
                { l: 'Dolgozók', v: `${facility.workers} fő` },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500 mb-1">{item.l}</div>
                  <div className="text-[12.5px] text-stone-900">{item.v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 mb-2">
                Hozzárendelt gépek ({facility.machinesList.length})
              </div>
              {facility.machinesList.length === 0 && (
                <div className="text-[12px] text-stone-400 italic">Nincs gép — raktári funkció</div>
              )}
              <div className="space-y-1">
                {facility.machinesList.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-stone-50 border border-stone-100"
                  >
                    <Icon name="production" size={13} className="text-stone-500" />
                    <span className="text-[12px] text-stone-800">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

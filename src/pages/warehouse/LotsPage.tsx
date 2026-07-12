function EndpointPending({ endpoint }: { endpoint: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 flex flex-col items-center gap-2 text-center">
      <div className="text-[13px] font-semibold text-amber-700">Backend endpoint nem elérhető</div>
      <code className="text-[11px] text-amber-600 bg-amber-100 rounded px-2 py-0.5">{endpoint}</code>
      <div className="text-[11px] text-stone-500 mt-1">Az endpoint implementálása után lesz élő adat</div>
    </div>
  )
}

export function LotsPage() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Lot-kezelés</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Aktív lot-ok, rendelkezésre állás és helyek</p>
      </div>
      <EndpointPending endpoint="GET /inventory/api/inventory/lots [?]" />
    </div>
  )
}

export function ZoneMapPage() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Zóna-térkép</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Lot-ok eloszlása elérhetőségi zónánként</p>
      </div>
      <EndpointPending endpoint="GET /inventory/api/inventory/zones [?]" />
    </div>
  )
}

export function MovementLogPage() {
  return (
    <div className="px-4 md:px-7 py-5 md:py-6 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-stone-900">Mozgások naplója</h1>
        <p className="text-[12.5px] text-stone-500 mt-0.5">Bevét / Kivét / Korrekció / Átvezetés</p>
      </div>
      <EndpointPending endpoint="GET /inventory/api/inventory/movements [?]" />
    </div>
  )
}

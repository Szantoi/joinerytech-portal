type FilterKey = 'all' | 'Bevét' | 'Kivét' | 'Maradék' | 'Korr.'

interface MovementsPageProps {
  embedded?: boolean
}

function EndpointPending({ endpoint }: { endpoint: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 flex flex-col items-center gap-2 text-center">
      <div className="text-[13px] font-semibold text-amber-700">Backend endpoint nem elérhető</div>
      <code className="text-[11px] text-amber-600 bg-amber-100 rounded px-2 py-0.5">{endpoint}</code>
      <div className="text-[11px] text-stone-500 mt-1">Az endpoint implementálása után lesz élő adat</div>
    </div>
  )
}

export function MovementsPage({ embedded = false }: MovementsPageProps) {
  return (
    <div className={embedded ? 'space-y-4' : 'px-7 py-6 space-y-4'}>
      <EndpointPending endpoint="GET /inventory/api/inventory/movements [?]" />
    </div>
  )
}

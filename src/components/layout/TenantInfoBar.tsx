import { useEffect } from 'react'
import { useApi, API_BASE } from '../../hooks/useApi'

interface Tenant {
  id: string
  name: string
  tier: string
}

// Hardcoded demo tenant ID — later from JWT claim
const DEMO_TENANT_ID = 'doorstar-kft'

export function TenantInfoBar() {
  const { data, isLoading, error, refetch } = useApi<Tenant>(
    `${API_BASE.kernel}/tenants/${DEMO_TENANT_ID}`
  )

  useEffect(() => {
    refetch()
  }, [refetch])

  if (isLoading) return null
  if (error || !data) return null  // silent fallback

  return (
    <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-2 mb-4 text-[12px] text-teal-800 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
      <span className="font-medium">{data.name}</span>
      <span className="text-teal-600">&middot; Csatlakozva</span>
    </div>
  )
}

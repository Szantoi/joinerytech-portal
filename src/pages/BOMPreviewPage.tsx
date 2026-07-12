import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BOMPreviewCard } from '../components/BOMPreviewCard'
import type { BOMPreview } from '../types/configurator.types'

export function BOMPreviewPage() {
  const { configId } = useParams<{ configId: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['bom-preview', configId],
    queryFn: async () => {
      const response = await fetch(`/api/products/preview/${configId}`)
      if (!response.ok) throw new Error('Failed to fetch BOM preview')
      return response.json() as Promise<BOMPreview>
    },
    enabled: !!configId
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Loading BOM preview...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-red-600">Error loading BOM preview: {error.message}</div>
      </div>
    )
  }

  if (!data || !configId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">No data found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <BOMPreviewCard
          configId={data.configId}
          bomItems={data.bomItems}
          estimatedPrice={data.estimatedPrice}
        />
      </div>
    </div>
  )
}

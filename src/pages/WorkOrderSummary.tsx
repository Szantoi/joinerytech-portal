import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { WorkOrderFormSchema } from '../types/configurator.types'
import type { WorkOrderForm, WorkOrderResponse, BOMPreview } from '../types/configurator.types'
import { z } from 'zod'

export function WorkOrderSummary() {
  const { configId } = useParams<{ configId: string }>()
  const [formData, setFormData] = useState<WorkOrderForm>({
    configId: configId || '',
    quantity: 1,
    deliveryDate: '',
    customerRef: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [workOrderResult, setWorkOrderResult] = useState<WorkOrderResponse | null>(null)

  // Fetch config preview
  const { data: configPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['bom-preview', configId],
    queryFn: async () => {
      const response = await fetch(`/api/products/preview/${configId}`)
      if (!response.ok) throw new Error('Failed to fetch preview')
      return response.json() as Promise<BOMPreview>
    },
    enabled: !!configId
  })

  const { mutate: createWorkOrder, isPending } = useMutation({
    mutationFn: async (data: WorkOrderForm) => {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create work order')
      return response.json() as Promise<WorkOrderResponse>
    },
    onSuccess: (data) => {
      setWorkOrderResult(data)
      // Download PDF
      window.open(data.pdfUrl, '_blank')
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      WorkOrderFormSchema.parse(formData)
      setErrors({})
      createWorkOrder(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          newErrors[err.path[0] as string] = err.message
        })
        setErrors(newErrors)
      }
    }
  }

  if (isLoadingPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Work Order Summary</h1>

        {/* Config Summary Card */}
        {configPreview && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Configuration Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Config ID:</span>
                <span className="ml-2 font-medium">{configPreview.configId}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated Price:</span>
                <span className="ml-2 font-medium">{configPreview.estimatedPrice.toLocaleString()} Ft</span>
              </div>
            </div>
          </div>
        )}

        {/* Work Order Form */}
        {!workOrderResult ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={1}
                />
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium mb-1">Delivery Date</label>
                <input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.deliveryDate && <p className="text-red-600 text-sm mt-1">{errors.deliveryDate}</p>}
              </div>

              <div>
                <label htmlFor="customerRef" className="block text-sm font-medium mb-1">Customer Reference</label>
                <input
                  id="customerRef"
                  type="text"
                  value={formData.customerRef}
                  onChange={(e) => setFormData({ ...formData, customerRef: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., PO-2026-042"
                />
                {errors.customerRef && <p className="text-red-600 text-sm mt-1">{errors.customerRef}</p>}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Additional notes or instructions..."
                />
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isPending ? 'Creating Work Order...' : 'Generate Work Order'}
              </button>
            </form>
          </div>
        ) : (
          /* Work Order Result */
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Work Order Created</h2>
              <span className="text-2xl font-bold text-green-600">{workOrderResult.workOrderId}</span>
            </div>

            {/* BOM Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-3 font-semibold">Item</th>
                    <th className="text-right py-2 px-3 font-semibold">Qty</th>
                    <th className="text-left py-2 px-3 font-semibold">Unit</th>
                    <th className="text-right py-2 px-3 font-semibold">Total Price</th>
                    <th className="text-left py-2 px-3 font-semibold">Supplier</th>
                    <th className="text-center py-2 px-3 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrderResult.bomItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3">{item.unit}</td>
                      <td className="py-2 px-3 text-right">{item.totalPrice.toLocaleString()} Ft</td>
                      <td className="py-2 px-3 text-sm text-gray-600">{item.supplier || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {item.inStock !== undefined && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.inStock ? 'In Stock' : 'To Order'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cost Summary */}
            <div className="border-t-2 border-gray-300 pt-4 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Material Cost:</span>
                <span className="font-semibold">{workOrderResult.totalMaterialCost.toLocaleString()} Ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Labor:</span>
                <span className="font-semibold">{workOrderResult.estimatedLabor.toLocaleString()} Ft</span>
              </div>
              <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
                <span className="font-bold">Total Cost:</span>
                <span className="font-bold text-blue-600">{workOrderResult.totalCost.toLocaleString()} Ft</span>
              </div>
            </div>

            {/* Scheduling Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Scheduled Start:</span>
                  <span className="ml-2 font-medium">{workOrderResult.scheduledStart}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Completion:</span>
                  <span className="ml-2 font-medium">{workOrderResult.estimatedCompletion}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

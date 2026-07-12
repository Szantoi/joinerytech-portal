import { useNavigate } from 'react-router-dom'
import type { BOMItem } from '../types/configurator.types'

export interface BOMPreviewProps {
  configId: string
  bomItems: BOMItem[]
  estimatedPrice: number
}

export function BOMPreviewCard({ configId, bomItems, estimatedPrice }: BOMPreviewProps) {
  const navigate = useNavigate()

  const totalMaterialCost = bomItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const estimatedLabor = estimatedPrice - totalMaterialCost

  const handleCreateWorkOrder = () => {
    navigate(`/work-orders/new/${configId}`)
  }

  const handleDownloadPDF = () => {
    // This would open the PDF URL from the API response
    window.open(`/api/products/preview/${configId}/pdf`, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Bill of Materials Preview</h2>

      {/* BOM Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-3 font-semibold">Type</th>
              <th className="text-left py-2 px-3 font-semibold">Item Name</th>
              <th className="text-right py-2 px-3 font-semibold">Qty</th>
              <th className="text-left py-2 px-3 font-semibold">Unit</th>
              <th className="text-right py-2 px-3 font-semibold">Unit Price</th>
              <th className="text-right py-2 px-3 font-semibold">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <span
                    className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${item.itemType === 'material' ? 'bg-blue-100 text-blue-800' : ''}
                      ${item.itemType === 'veneer' ? 'bg-green-100 text-green-800' : ''}
                      ${item.itemType === 'fitting' ? 'bg-purple-100 text-purple-800' : ''}
                    `}
                  >
                    {item.itemType}
                  </span>
                </td>
                <td className="py-2 px-3">{item.name}</td>
                <td className="py-2 px-3 text-right">{item.quantity}</td>
                <td className="py-2 px-3">{item.unit}</td>
                <td className="py-2 px-3 text-right">{item.unitPrice.toLocaleString()} Ft</td>
                <td className="py-2 px-3 text-right font-semibold">{item.totalPrice.toLocaleString()} Ft</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t-2 border-gray-300 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Material Cost:</span>
          <span className="font-semibold">{totalMaterialCost.toLocaleString()} Ft</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Labor:</span>
          <span className="font-semibold">{estimatedLabor.toLocaleString()} Ft</span>
        </div>
        <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
          <span className="font-bold">Total Estimated Price:</span>
          <span className="font-bold text-blue-600">{estimatedPrice.toLocaleString()} Ft</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Download PDF
        </button>
        <button
          onClick={handleCreateWorkOrder}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create Work Order
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { usePricingRules } from '../hooks/usePricingRules';
import { EditPricingRuleSlideOver } from './EditPricingRuleSlideOver';

export const PricingRulesPanel = () => {
  const { pricingRules, fetchPricingRules, updatePricingRule, isLoading, error } = usePricingRules();
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  useEffect(() => {
    fetchPricingRules();
  }, []);

  if (isLoading) {
    return <div className="text-center py-20">Loading pricing rules...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
        {error}
      </div>
    );
  }

  const priceList = pricingRules?.priceLists?.[0]; // Active price list

  return (
    <div className="space-y-6">
      {/* Material Pricing Table */}
      <div className="bg-white rounded-lg shadow border border-stone-200/80">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Material Pricing</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Material Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price / m²
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Currency
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {priceList?.materials?.map((material: any) => (
              <tr key={material.type}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {material.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {material.pricePerM2.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => setEditingMaterial(material)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Complexity Modifiers Table */}
      <div className="bg-white rounded-lg shadow border border-stone-200/80">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Complexity Modifiers</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Modifier Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Multiplier
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {priceList?.modifiers?.map((modifier: any) => (
              <tr key={modifier.type}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {modifier.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {modifier.multiplier.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="text-blue-600 hover:text-blue-900">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit SlideOver */}
      {editingMaterial && (
        <EditPricingRuleSlideOver
          material={editingMaterial}
          priceListId={priceList?.id}
          onClose={() => setEditingMaterial(null)}
          onSave={(updatedMaterial) => {
            updatePricingRule(priceList?.id, updatedMaterial);
            setEditingMaterial(null);
          }}
        />
      )}
    </div>
  );
};

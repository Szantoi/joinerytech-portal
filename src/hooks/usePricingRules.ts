import { useState } from 'react';

// Mock data for development
const MOCK_PRICING_RULES = {
  priceLists: [
    {
      id: 'pl-001',
      name: 'Active Price List 2026 Q2',
      status: 'active',
      materials: [
        { type: 'MDF', pricePerM2: 8500, currency: 'HUF' },
        { type: 'Plywood', pricePerM2: 12000, currency: 'HUF' },
        { type: 'Chipboard', pricePerM2: 6500, currency: 'HUF' },
        { type: 'OSB', pricePerM2: 7200, currency: 'HUF' }
      ],
      modifiers: [
        { type: 'Curved Edge', multiplier: 1.5 },
        { type: 'Complex Shape', multiplier: 1.8 },
        { type: 'Multiple Materials', multiplier: 1.3 },
        { type: 'Tight Tolerances', multiplier: 1.4 }
      ]
    }
  ]
};

export const usePricingRules = () => {
  const [pricingRules, setPricingRules] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingRules = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cutting/pricing/rules');

      if (response.ok) {
        const data = await response.json();
        setPricingRules(data);
      } else {
        throw new Error('API not available');
      }
    } catch (err) {
      console.log('Using mock pricing rules data');
      setPricingRules(MOCK_PRICING_RULES);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePricingRule = async (priceListId: string, updatedMaterial: any) => {
    try {
      const response = await fetch(`/api/cutting/pricing/rules/${priceListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: [updatedMaterial] })
      });

      if (response.ok) {
        // Refresh pricing rules after update
        await fetchPricingRules();
        return true;
      } else {
        throw new Error('Failed to update pricing rule');
      }
    } catch (err) {
      console.log('Mock: Updated pricing rule locally');
      // In mock mode, update locally
      if (pricingRules?.priceLists?.[0]) {
        const updatedPriceList = { ...pricingRules.priceLists[0] };
        updatedPriceList.materials = updatedPriceList.materials.map((m: any) =>
          m.type === updatedMaterial.type ? updatedMaterial : m
        );
        setPricingRules({ priceLists: [updatedPriceList] });
      }
      return true;
    }
  };

  return { pricingRules, fetchPricingRules, updatePricingRule, isLoading, error };
};

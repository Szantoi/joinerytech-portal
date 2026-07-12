import { useState } from 'react';

interface Props {
  material: any;
  priceListId: string;
  onClose: () => void;
  onSave: (updatedMaterial: any) => void;
}

export const EditPricingRuleSlideOver = ({ material, priceListId, onClose, onSave }: Props) => {
  const [pricePerM2, setPricePerM2] = useState(material.pricePerM2);

  const handleSave = () => {
    onSave({ ...material, pricePerM2 });
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* SlideOver */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Edit Material Price</h2>

          <div className="mb-4">
            <label htmlFor="material-type" className="block text-sm font-medium mb-2">Material Type</label>
            <input
              id="material-type"
              type="text"
              value={material.type}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="price-per-m2" className="block text-sm font-medium mb-2">Price per m²</label>
            <input
              id="price-per-m2"
              type="number"
              value={pricePerM2}
              onChange={(e) => setPricePerM2(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="0"
              step="100"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="currency" className="block text-sm font-medium mb-2">Currency</label>
            <input
              id="currency"
              type="text"
              value={material.currency}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { queueForSync } from '../../lib/offline-asn';
import type { ASN } from '../../data/mock-asn';

interface ReceiptConfirmDialogProps {
  asn: ASN;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReceiptConfirmDialog: React.FC<ReceiptConfirmDialogProps> = ({
  asn,
  onConfirm,
  onCancel,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    asn.items.reduce((acc, item) => ({ ...acc, [item.name]: item.quantity }), {})
  );
  const [notes, setNotes] = useState('');
  const [scannedBy, setScannedBy] = useState('');

  const handleConfirm = () => {
    queueForSync({
      qrPayload: asn.qrPayload,
      scannedBy,
      actualQuantity: quantities,
      notes: notes || undefined,
    });
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Confirm Receipt
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>ASN ID:</strong> {asn.id}</div>
              <div><strong>PO ID:</strong> {asn.poId}</div>
              <div><strong>Expected:</strong> {asn.expectedDate}</div>
              <div><strong>Supplier:</strong> {asn.supplierId}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scanned By (Your Name)
            </label>
            <input
              type="text"
              value={scannedBy}
              onChange={(e) => setScannedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your name"
            />
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Verify Quantities
            </h3>
            <div className="space-y-2">
              {asn.items.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-sm flex-1">{item.name}</span>
                  <input
                    type="number"
                    value={quantities[item.name]}
                    onChange={(e) =>
                      setQuantities({ ...quantities, [item.name]: parseInt(e.target.value, 10) })
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-500">{item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Any damage, missing items, or other notes..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!scannedBy}
              className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              ✅ Confirm Receipt
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

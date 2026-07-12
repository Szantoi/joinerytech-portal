import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateASN } from '../../data/mock-asn';
import type { ASN } from '../../data/mock-asn';

interface AsnGeneratorProps {
  poId: string;
  supplierId: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
}

export const AsnGenerator: React.FC<AsnGeneratorProps> = ({
  poId,
  supplierId,
  items,
}) => {
  const [asn, setAsn] = useState<ASN | null>(null);
  const [expectedDate, setExpectedDate] = useState<string>('');

  const handleGenerate = () => {
    const generated = generateASN(poId, supplierId, expectedDate, items);
    setAsn(generated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="asn-generator bg-white border border-gray-300 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Generate ASN & QR Code
      </h3>

      {!asn ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="expected-date" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Delivery Date
            </label>
            <input
              type="date"
              id="expected-date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-50 rounded p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Order Details:</div>
            <div className="text-sm text-gray-600">
              <p>PO ID: <span className="font-mono">{poId}</span></p>
              <p>Supplier ID: <span className="font-mono">{supplierId}</span></p>
              <p className="mt-2 font-medium">Items:</p>
              <ul className="list-disc list-inside ml-2">
                {items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} - {item.quantity} {item.unit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!expectedDate}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Generate ASN & QR Code
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-green-900">ASN Generated Successfully</span>
            </div>
            <p className="text-sm text-green-700">
              ASN ID: <span className="font-mono font-bold">{asn.id}</span>
            </p>
          </div>

          <div className="flex justify-center p-6 bg-white border-2 border-gray-300 rounded-lg">
            <QRCodeSVG value={asn.qrPayload} size={256} level="H" />
          </div>

          <div className="bg-gray-50 rounded p-4 text-sm font-mono text-gray-700">
            <div className="font-semibold mb-1">QR Payload:</div>
            <div className="break-all">{asn.qrPayload}</div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              🖨️ Print Label
            </button>
            <button
              type="button"
              onClick={() => setAsn(null)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import jsQR from 'jsqr';
import { validateFromCache } from '../../lib/offline-asn';
import type { ASN } from '../../data/mock-asn';

interface QrScannerProps {
  onScanSuccess: (asn: ASN) => void;
  onScanError: (error: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({
  onScanSuccess,
  onScanError,
}) => {
  const [scanning, setScanning] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);

    try {
      const imageData = await loadImage(file);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (!code) {
        onScanError('No QR code found in image');
        setScanning(false);
        return;
      }

      // Validate from cache
      const validation = validateFromCache(code.data);
      if (!validation.valid || !validation.asn) {
        onScanError(validation.error || 'Invalid QR code');
        setScanning(false);
        return;
      }

      onScanSuccess(validation.asn);
    } catch (error) {
      onScanError(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  const loadImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        if (imageData) {
          resolve(imageData);
        } else {
          reject(new Error('Failed to get image data'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="qr-scanner bg-white border border-gray-300 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Scan QR Code
      </h3>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg
            className="mx-auto w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <p className="text-sm text-gray-600 mb-4">
            Upload QR code image or use camera
          </p>
          <label
            htmlFor="qr-upload"
            className="inline-block px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            {scanning ? 'Processing...' : '📷 Choose Image / Take Photo'}
          </label>
          <input
            type="file"
            id="qr-upload"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            disabled={scanning}
            className="hidden"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <strong>Tip:</strong> On mobile devices, you can use the camera directly by clicking the button above.
        </div>
      </div>
    </div>
  );
};

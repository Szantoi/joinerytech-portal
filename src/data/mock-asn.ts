/**
 * Mock ASN (Advanced Shipping Notice) generator
 * Phase 1: localStorage-based mock implementation
 */

export interface ASN {
  id: string;
  poId: string;
  supplierId: string;
  expectedDate: string;
  qrPayload: string;
  status: 'SHIPPED' | 'RECEIVED' | 'PENDING_SYNC';
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
  offlineScannedAt?: string;
}

/**
 * Generate a simple hash for mock QR payload
 * In production, this would be SHA-256 server-side
 */
function generateMockHash(asn: string, po: string, date: string): string {
  const combined = `${asn}${po}${date}MOCK_SECRET`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate ASN for a Purchase Order
 */
export function generateASN(poId: string, supplierId: string, expectedDate: string, items: ASN['items']): ASN {
  const timestamp = new Date().toISOString();
  const asnId = `ASN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const hash = generateMockHash(asnId, poId, expectedDate);
  const qrPayload = `${asnId}|${poId}|${expectedDate}|${hash}`;

  const asn: ASN = {
    id: asnId,
    poId,
    supplierId,
    expectedDate,
    qrPayload,
    status: 'SHIPPED',
    items,
    createdAt: timestamp,
  };

  // Store in localStorage (mock persistence)
  const storedASNs = getStoredASNs();
  storedASNs.push(asn);
  localStorage.setItem('mock_asns', JSON.stringify(storedASNs));

  return asn;
}

/**
 * Get all stored ASNs from localStorage
 */
export function getStoredASNs(): ASN[] {
  const stored = localStorage.getItem('mock_asns');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Find ASN by QR payload
 */
export function findASNByQRPayload(qrPayload: string): ASN | null {
  const asns = getStoredASNs();
  return asns.find((asn) => asn.qrPayload === qrPayload) || null;
}

/**
 * Validate QR payload format and hash
 */
export function validateQRPayload(qrPayload: string): { valid: boolean; error?: string; asnId?: string } {
  const parts = qrPayload.split('|');

  if (parts.length !== 4) {
    return { valid: false, error: 'Invalid QR code format' };
  }

  const [asnId, poId, expectedDate, hash] = parts;
  const expectedHash = generateMockHash(asnId, poId, expectedDate);

  if (hash !== expectedHash) {
    return { valid: false, error: 'Hash verification failed - QR code may be tampered' };
  }

  return { valid: true, asnId };
}

/**
 * Update ASN status (e.g., after scanning)
 */
export function updateASNStatus(asnId: string, status: ASN['status'], offlineScannedAt?: string): boolean {
  const asns = getStoredASNs();
  const index = asns.findIndex((asn) => asn.id === asnId);

  if (index === -1) return false;

  asns[index] = {
    ...asns[index],
    status,
    offlineScannedAt,
  };

  localStorage.setItem('mock_asns', JSON.stringify(asns));
  return true;
}

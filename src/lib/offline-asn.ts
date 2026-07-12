/**
 * Offline-first ASN scanning and receipt management
 * Phase 1: localStorage-based sync queue
 */

import { findASNByQRPayload, validateQRPayload, updateASNStatus } from '../data/mock-asn';
import type { ASN } from '../data/mock-asn';

export interface ReceiptData {
  id: string;
  qrPayload: string;
  scannedBy: string;
  actualQuantity: Record<string, number>; // itemName -> quantity
  notes?: string;
  scannedAt: string;
  synced: boolean;
}

/**
 * Validate ASN from local cache (instant feedback)
 */
export function validateFromCache(qrPayload: string): {
  valid: boolean;
  error?: string;
  asn?: ASN;
} {
  // Validate format and hash
  const validation = validateQRPayload(qrPayload);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  // Find in cache
  const asn = findASNByQRPayload(qrPayload);
  if (!asn) {
    return { valid: false, error: 'ASN not found in cache - may need backend verification' };
  }

  if (asn.status === 'RECEIVED') {
    return { valid: false, error: 'ASN already received - duplicate scan detected' };
  }

  return { valid: true, asn };
}

/**
 * Queue receipt for sync (offline-first)
 */
export function queueForSync(receiptData: Omit<ReceiptData, 'id' | 'scannedAt' | 'synced'>): ReceiptData {
  const receipt: ReceiptData = {
    id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    scannedAt: new Date().toISOString(),
    synced: false,
    ...receiptData,
  };

  const queue = getPendingReceipts();
  queue.push(receipt);
  localStorage.setItem('receipt_sync_queue', JSON.stringify(queue));

  // Update ASN status to PENDING_SYNC
  const validation = validateQRPayload(receiptData.qrPayload);
  if (validation.valid && validation.asnId) {
    updateASNStatus(validation.asnId, 'PENDING_SYNC', receipt.scannedAt);
  }

  return receipt;
}

/**
 * Get pending receipts from queue
 */
export function getPendingReceipts(): ReceiptData[] {
  const stored = localStorage.getItem('receipt_sync_queue');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Sync pending receipts to backend (when online)
 */
export async function syncPendingReceipts(): Promise<{ synced: number; failed: number }> {
  const queue = getPendingReceipts();
  const unsynced = queue.filter((r) => !r.synced);

  if (unsynced.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const receipt of unsynced) {
    try {
      // Phase 1: Mock sync (just mark as synced)
      // Phase 2: POST /api/inbound/receipt/scan
      await mockBackendSync(receipt);

      // Mark as synced
      receipt.synced = true;
      syncedCount++;

      // Update ASN status to RECEIVED
      const validation = validateQRPayload(receipt.qrPayload);
      if (validation.valid && validation.asnId) {
        updateASNStatus(validation.asnId, 'RECEIVED');
      }
    } catch (error) {
      console.error('Failed to sync receipt:', receipt.id, error);
      failedCount++;
    }
  }

  // Update queue
  localStorage.setItem('receipt_sync_queue', JSON.stringify(queue));

  return { synced: syncedCount, failed: failedCount };
}

/**
 * Mock backend sync (Phase 1)
 * In Phase 2, replace with actual fetch()
 */
async function mockBackendSync(receipt: ReceiptData): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[Mock Sync] Receipt synced:', receipt.id);
      resolve();
    }, 500);
  });
}

/**
 * Clear synced receipts from queue
 */
export function clearSyncedReceipts(): number {
  const queue = getPendingReceipts();
  const unsynced = queue.filter((r) => !r.synced);
  const clearedCount = queue.length - unsynced.length;

  localStorage.setItem('receipt_sync_queue', JSON.stringify(unsynced));

  return clearedCount;
}

/**
 * Setup online/offline event listeners for auto-sync
 */
export function setupAutoSync(): () => void {
  const handleOnline = () => {
    console.log('[AutoSync] Device is online - syncing pending receipts');
    syncPendingReceipts();
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

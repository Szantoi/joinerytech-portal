import React, { useEffect, useState } from 'react';
import { getPendingReceipts, syncPendingReceipts, clearSyncedReceipts, setupAutoSync } from '../../lib/offline-asn';

export const OfflineSyncQueue: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updatePendingCount = () => {
      const pending = getPendingReceipts();
      setPendingCount(pending.filter((r) => !r.synced).length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const cleanupAutoSync = setupAutoSync();

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupAutoSync();
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPendingReceipts();
      alert(`Synced ${result.synced} receipts. ${result.failed} failed.`);
      clearSyncedReceipts();
      setPendingCount(getPendingReceipts().filter((r) => !r.synced).length);
    } catch (error) {
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className={`offline-sync-queue fixed bottom-4 right-4 rounded-lg shadow-lg p-4 ${
      isOnline ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {pendingCount} receipt{pendingCount !== 1 ? 's' : ''} pending sync
          </div>
          <div className="text-xs text-gray-600">
            {isOnline ? 'Online - ready to sync' : 'Offline - will sync when online'}
          </div>
        </div>
        {isOnline && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing}
            className="ml-auto px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};

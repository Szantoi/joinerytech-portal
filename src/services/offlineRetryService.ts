import { useIncidentDraftStore } from '../stores/incidentDraftStore';

/**
 * Offline retry service
 * Polls every 5 minutes to retry failed incident submissions
 *
 * Note: We use polling instead of Background Sync API because
 * iOS Safari doesn't support it
 */
export function startRetryService() {
  const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_RETRIES = 3;

  const retryFailed = async () => {
    const state = useIncidentDraftStore.getState();
    const failedDrafts = state.drafts.filter(
      d => d.status === 'failed' && d.retryCount < MAX_RETRIES
    );

    if (failedDrafts.length === 0) return;

    console.log(`[OfflineRetry] Retrying ${failedDrafts.length} failed drafts...`);

    for (const draft of failedDrafts) {
      try {
        await state.retryFailed(draft.id);
        console.log(`[OfflineRetry] Successfully retried draft ${draft.id}`);
      } catch (error) {
        console.error(`[OfflineRetry] Failed to retry draft ${draft.id}:`, error);
        // Silent fail, will retry next cycle
      }
    }
  };

  // Run immediately on start (after 10s delay)
  setTimeout(retryFailed, 10000);

  // Then run every 5 minutes
  const intervalId = setInterval(retryFailed, RETRY_INTERVAL);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

import { useEffect } from 'react';

// Re-runs `refresh` when the app comes back to the foreground or a push
// notification arrives, so both phones see each other's changes.
export function useLiveRefresh(refresh) {
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const onMessage = (e) => { if (e.data?.type === 'refresh') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [refresh]);
}

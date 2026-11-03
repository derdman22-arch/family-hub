import { useState } from 'react';
import { enableNotifications, isPushSupported, isStandalone } from '../services/pushService';

const DISMISS_KEY = 'fh_notif_banner_dismissed';
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

// Prompts to turn on notifications, or on an iPhone in Safari, explains that
// the app has to be added to the Home Screen first (iOS only allows push there).
export default function NotificationsBanner() {
  const [permission, setPermission] = useState(() => (isPushSupported() ? Notification.permission : 'unsupported'));
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  async function turnOn() {
    setBusy(true);
    setError(null);
    try {
      setPermission(await enableNotifications());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (permission === 'unsupported' && isIOS && !isStandalone() && !dismissed) {
    return (
      <Banner onDismiss={dismiss}>
        To get notifications, add Family Hub to your Home Screen: tap <b>Share</b> then
        {' '}<b>Add to Home Screen</b>, and open it from there.
      </Banner>
    );
  }

  if (permission === 'default') {
    return (
      <Banner>
        <div className="flex items-center gap-3">
          <span className="flex-1">Get a notification when a to-do is added or completed.</span>
          <button
            onClick={turnOn}
            disabled={busy}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            {busy ? 'Turning on…' : 'Turn on'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </Banner>
    );
  }

  return null;
}

function Banner({ children, onDismiss }) {
  return (
    <div className="relative bg-blue-950/40 border border-blue-800/50 text-blue-100 text-sm rounded-xl px-4 py-3 mb-4">
      {children}
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-1.5 right-2 text-blue-300/60 hover:text-blue-200 p-1" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

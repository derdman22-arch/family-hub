import { api } from './api';

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker failed:', err));
}

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function subscribe() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await api('/push/key');
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await api('/push/subscribe', { method: 'POST', body: sub.toJSON() });
}

// Must be called from a tap: iOS only shows the permission prompt in response
// to a user gesture, so the permission request comes before any network call.
export async function enableNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;
  await subscribe();
  return permission;
}

// On launch, re-send an existing subscription so the server has it for whoever
// is signed in on this device now.
export async function syncSubscription() {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  await subscribe().catch((err) => console.error('Push sync failed:', err));
}

// Called before signing out so this device stops getting the family's notifications
export async function disableNotifications() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}

export function setBadge(count) {
  if (!('setAppBadge' in navigator)) return;
  (count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()).catch(() => {});
}

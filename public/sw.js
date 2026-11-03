// Family Hub service worker: receives push notifications and keeps the
// home-screen badge in sync. It does no offline caching.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Family Hub', body: event.data && event.data.text() };
  }

  const tasks = [
    self.registration.showNotification(data.title || 'Family Hub', {
      body: data.body || '',
      icon: '/logo192.png',
      data: { url: data.url || '/' },
    }),
    // Tell any open copy of the app to reload its lists
    self.clients.matchAll({ type: 'window' }).then((clients) =>
      clients.forEach((c) => c.postMessage({ type: 'refresh' }))
    ),
  ];
  if (typeof data.badge === 'number' && self.navigator.setAppBadge) {
    tasks.push(data.badge > 0 ? self.navigator.setAppBadge(data.badge) : self.navigator.clearAppBadge());
  }
  event.waitUntil(Promise.all(tasks).catch(() => {}));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => 'focus' in c);
      if (open) return open.focus();
      return self.clients.openWindow(url);
    })
  );
});

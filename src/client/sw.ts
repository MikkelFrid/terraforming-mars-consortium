/* Service worker — Web Push "your turn" notifications. */

/// <reference lib="webworker" />

export {};

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let title = 'Terraforming Mars';
  let body = "It's your turn!";
  let url = '/';
  try {
    const data = event.data?.json() as {title?: string; body?: string; url?: string} | undefined;
    if (data?.title) {
      title = data.title;
    }
    if (data?.body) {
      body = data.body;
    }
    if (data?.url) {
      url = data.url;
    }
  } catch (_e) {
    const text = event.data?.text();
    if (text) {
      body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: 'favicon.ico',
      data: {url},
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          const focused = client.focus();
          if ('navigate' in client && typeof (client as WindowClient).navigate === 'function') {
            return focused.then(() => (client as WindowClient).navigate(url));
          }
          return focused;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    }),
  );
});

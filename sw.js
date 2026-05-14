// ShieldSync Service Worker — v1.0.0
const CACHE = 'shieldsync-v1';
const OFFLINE_URL = '/index.html';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shieldsync-icon.svg',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Always network-first for fonts and external resources
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets, network-first for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return res;
        });
      })
    );
  }
});

// Background sync for offline incident reports
self.addEventListener('sync', event => {
  if (event.tag === 'sync-incidents') {
    event.waitUntil(syncPendingIncidents());
  }
});

async function syncPendingIncidents() {
  // Placeholder: in production this would POST queued IndexedDB records
  console.log('[SW] Syncing pending incidents...');
}

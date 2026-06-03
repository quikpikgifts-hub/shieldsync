/**
 * ShieldSync Service Worker — Offline-first PWA
 *
 * Strategy:
 *  - App shell (HTML, JS, CSS, fonts) → Cache First (instant load)
 *  - API calls (/api/*) → Network First with queue fallback
 *  - Static assets (/assets/*) → Cache First (versioned, immutable)
 */

const CACHE   = "shieldsync-v1";
const OFFLINE = "/offline.html";

// Resources to pre-cache on install
const PRECACHE = ["/", "/manifest.json", "/favicon.svg"];

// ─── Install ──────────────────────────────────────────────────────
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

// ─── Activate ────────────────────────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls → Network first, no cache
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: "offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    ));
    return;
  }

  // Static assets (/assets/) → Cache first (they are content-hashed)
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // App shell (navigation requests) → Network first, fall back to cache
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then(c => c || caches.match("/")))
  );
});

// ─── Background sync queue (offline action replay) ────────────────
// When actions are taken offline they are stored in localStorage by db.js.
// On reconnect this event fires so the app can flush the queue.
self.addEventListener("sync", e => {
  if (e.tag === "ss-sync") {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: "SYNC_READY" }))
      )
    );
  }
});

// ─── Push notifications ───────────────────────────────────────────
self.addEventListener("push", e => {
  const data = e.data?.json() ?? { title: "ShieldSync", body: "New alert" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/favicon.svg",
      badge:   "/favicon.svg",
      tag:     data.tag ?? "shieldsync",
      renotify: true,
      data:    data,
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clients => {
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});

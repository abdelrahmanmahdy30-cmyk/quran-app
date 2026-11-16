/**
 * sw.js - Service Worker لتطبيق حافظ (Hafiz Quran PWA)
 * يوفر دعماً كاملاً للعمل دون إنترنت (Offline-First) وتخزين الأصول محلياً
 */

const CACHE_NAME = "hafiz-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/quran",
  "/stats",
  "/settings",
  "/account",
  "/manifest.json",
  "/icon.svg",
  "/apple-icon.png",
  "/icon-dark-32x32.png",
];

// تثبيت الـ Service Worker وتخزين الأصول الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Some assets could not be precached:", err);
      });
    })
  );
  self.skipWaiting();
});

// تنشيط وحذف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات واستراتيجية Network First مع Offline Fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // تجاوز طلبات الـ POST أو المزامنة مع Supabase والـ APIs الخارجية
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // للأصول الثابتة (أيقونات، خطوط، css) -> Cache First
  if (
    request.url.includes("/_next/static/") ||
    request.url.endsWith(".svg") ||
    request.url.endsWith(".png") ||
    request.url.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // لصفحات التنقل -> Network First مع Fallback إلى Cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("غير متصل بالإنترنت", { status: 503, statusText: "Offline" });
        });
      })
  );
});

const CACHE_NAME = 'prontuvet-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/history',
  '/templates',
  '/prontuvet-icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache core assets for instant shell loading
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for main data, Cache-first for static assets
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api') || url.pathname.includes('/auth') || url.hostname.includes('supabase.co')) {
    // API, Auth e URLs do Supabase (Imagens) devem sempre passar direto pela internet
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found, otherwise fetch from secondary network
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionally cache new assets encountered
        if (event.request.method === 'GET' && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                if (!url.pathname.startsWith('/api')) {
                    cache.put(event.request, responseToCache);
                }
            });
        }
        return fetchResponse;
      });
    }).catch(() => {
        // Fallback for offline usage if needed
        if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
        }
    })
  );
});

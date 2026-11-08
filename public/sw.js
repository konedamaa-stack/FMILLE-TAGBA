const CACHE_NAME = 'tagba-pwa-v49';

const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/supabase.js',
  '/js/app.js',
  '/js/print.js',
  '/manifest.json',
  '/icon.svg'
];

// Installation : Mise en cache fichier par fichier
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        LOCAL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Cache miss:', url, err))
        )
      );
      try {
        await cache.add('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      } catch (_) {}
    })
  );
});

// Activation : Prise de contrôle immédiate et purge totale des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes : Stratégie Network-First intégrale (Garantit les données fraîches en ligne)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkRes;
      })
      .catch(async () => {
        // Fallback Cache en cas de coupure réseau
        const cached = await caches.match(req, { ignoreSearch: true })
          || await caches.match('/index.html')
          || await caches.match('/');
        if (cached) return cached;

        if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
          return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>TAGBA Hors-Ligne</title></head><body style="background:#0a0f1d;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>🏛️ Mutuelle TAGBA</h2><p>Mode hors-ligne.</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;background:#10b981;color:#fff;border:none;cursor:pointer;">Réessayer</button></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

        return new Response('', { status: 404, statusText: 'Not Found Offline' });
      })
  );
});

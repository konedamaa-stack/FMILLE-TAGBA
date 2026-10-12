const CACHE_NAME = 'tagba-pwa-v4';

const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/supabase.js',
  '/js/app.js',
  '/manifest.json',
  '/icon.svg'
];

// Installation : Mise en cache robuste fichier par fichier (aucun blocage)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cacher chaque ressource locale individuellement
      await Promise.allSettled(
        LOCAL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Cache miss:', url, err))
        )
      );
      // Tenter la mise en cache de la bibliothèque Supabase CDN
      try {
        await cache.add('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      } catch (_) {}
    })
  );
});

// Activation : Prise de contrôle immédiate et purge des anciennes versions
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

// Interception des requêtes : Stale-While-Revalidate / Network-First avec repli 100% garanti
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Uniquement les requêtes GET
  if (req.method !== 'GET') return;

  // Ignorer les requêtes d'API Supabase directes (gérées par le client localement)
  if (url.hostname.includes('supabase.co')) return;

  // 1. Pour la navigation principale (ex: chargement de la page https://www.tagbala.xyz/? ...)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
              cache.put('/', copy.clone());
              cache.put('/index.html', copy.clone());
            });
          }
          return networkRes;
        })
        .catch(async () => {
          // Hors-ligne : Trouver la page dans le cache avec ou sans paramètres d'URL
          const cached = await caches.match(req, { ignoreSearch: true })
            || await caches.match('/index.html')
            || await caches.match('/');
          if (cached) return cached;

          // Si aucun cache direct, renvoyer la première page HTML trouvée dans le cache
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const k of keys) {
            if (k.url.endsWith('/') || k.url.includes('index.html')) {
              const res = await cache.match(k);
              if (res) return res;
            }
          }

          return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>TAGBA Hors-Ligne</title></head><body style="background:#0a0f1d;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>🏛️ Mutuelle TAGBA</h2><p>Veuillez charger le site une fois avec connexion pour activer le mode hors-ligne complet.</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;background:#10b981;color:#fff;border:none;cursor:pointer;">Réessayer</button></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Pour les fichiers CSS, JS, Images, etc.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
      // Si trouvé en cache, le servir immédiatement tout en tentant une mise à jour en arrière-plan
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkRes;
      }).catch(() => null);

      return cachedRes || fetchPromise.then((res) => {
        if (res) return res;
        return new Response('', { status: 404, statusText: 'Not Found Offline' });
      });
    })
  );
});

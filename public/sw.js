const CACHE_NAME = 'tagba-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/supabase.js',
  '/js/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

// Installation : Mise en cache initiale des fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Mise en cache des assets hors-ligne');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Erreur mise en cache initiale (non bloquante):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Suppression ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes : Stratégie Network-First avec fallback Cache pour fonctionnement 100% hors-ligne
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorer les requêtes POST/PUT/DELETE ou requêtes Supabase REST (qui sont gérées localement dans l'app)
  if (req.method !== 'GET') {
    return;
  }

  // Ne pas cacher les appels directs aux APIs Supabase
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Si le réseau répond, on met à jour la copie locale en cache
        if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(async () => {
        // En cas de coupure internet (ERR_INTERNET_DISCONNECTED / offline) :
        // On sert instantanément la version en cache local !
        const cachedRes = await caches.match(req);
        if (cachedRes) {
          return cachedRes;
        }

        // Si la requête concerne la navigation de page (ex: / ou /index.html)
        if (req.mode === 'navigate') {
          const fallbackPage = await caches.match('/index.html') || await caches.match('/');
          if (fallbackPage) return fallbackPage;
        }

        return new Response('Application hors ligne. Les données locales sont conservées.', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});

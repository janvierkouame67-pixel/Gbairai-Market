// Gbairai Market : permet l'installation et un démarrage rapide.
// Le site est toujours chargé depuis Internet d'abord ; la copie sert seulement hors connexion.
const CACHE = 'gbairai-v10';
const FICHIERS = ['/', '/index.html', '/styles.css', '/app.js', '/statut.js', '/config.js', '/install.js', '/intro.js', '/bulle.js', '/icons/logo.svg', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase, polices… : jamais en cache
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});

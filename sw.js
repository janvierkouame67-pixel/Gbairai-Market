// Gbairai Market : permet l'installation et un démarrage rapide.
// Le site est toujours chargé depuis Internet d'abord ; la copie sert seulement hors connexion.
const CACHE = 'gbairai-v40';
const FICHIERS = ['/', '/index.html', '/styles.css', '/app.js', '/plus.js', '/statut.js', '/voix.js', '/config.js', '/install.js', '/intro.js', '/bulle.js', '/icons/logo.svg', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Supabase, polices… : jamais en cache
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});

// Notifications : nouveautés des boutiques suivies et étapes des commandes
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Gbairai Market', {
    body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', image: d.image,
    tag: d.tag, renotify: !!d.tag, data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  }));
});

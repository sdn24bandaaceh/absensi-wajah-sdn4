const CACHE_NAME = 'absensi-wajah-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './absensi.html',
  './dashboard.html',
  './foto-absensi.html',
  './assets/css/style.css',
  './assets/css/dashboard.css',
  './assets/js/app.js',
  './assets/js/auth.js',
  './assets/js/absensi.js',
  './assets/js/dashboard.js',
  './assets/js/foto-absensi.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.warn('PWA Cache install skipped for some missing assets', err))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cache or network fallback
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

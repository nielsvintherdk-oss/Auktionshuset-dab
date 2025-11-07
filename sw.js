const CACHE_NAME = 'dab-field-tool-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/components/Header.tsx',
  '/components/Nav.tsx',
  '/components/RegistrationForm.tsx',
  '/components/StatusBar.tsx',
  '/components/ItemList.tsx',
  '/components/TasksPage.tsx',
  '/components/LoginScreen.tsx',
  '/components/LotDetailModal.tsx',
  '/components/HandbookPage.tsx',
  '/components/PinScreen.tsx',
  '/components/icons.tsx',
  '/components/TaskRegistrationForm.tsx',
  '/components/TaskList.tsx',
  '/components/handbookData.ts'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // addAll can fail if one of the resources fails to be fetched.
        // It's atomic.
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || event.request.method !== 'GET') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
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
